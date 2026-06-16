/**
 * Filter + Sort 协议工具（多维度搜索/排序）
 *
 * 设计目标：
 *  - 给 list 端点提供安全的 filter/sort 入参解析（防 NoSQL 注入）。
 *  - 任何 field 名必须在调用方声明的白名单内；不在白名单 → BizError(400)。
 *  - op 必须支持 5 种语义（eq / in / contains / gte / lte）；非法 op → BizError(400)。
 *  - value 类型与 op 必须匹配（in 要求 array；contains 要求 string；其他不限）。
 *  - 同 field 多条用 $and 合；sort 多条按数组顺序拼对象。
 *
 * 协议示例（前端入参）：
 *
 *   filter: [
 *     { field: 'text',     op: 'contains', value: '机房' },
 *     { field: 'time',     op: 'gte',      value: '2024-01-01' },
 *     { field: 'category', op: 'in',       value: ['a', 'b', 'c'] },
 *     { field: 'text',     op: 'contains', value: '电力' },   // 同 field 多条 → $and
 *   ]
 *
 *   sort: [
 *     { field: 'time', dir: 'desc' },
 *     { field: '_id',  dir: 'asc' },
 *   ]
 *
 * 输出（mongoose query 直接消费）：
 *
 *   filter → {
 *     text:     { $regex: '机房', $options: 'i' },
 *     time:     { $gte: '2024-01-01' },
 *     category: { $in: ['a', 'b', 'c'] },
 *     $and: [
 *       { text: { $regex: '电力', $options: 'i' } },
 *     ],
 *   }
 *
 *   sort → { time: -1, _id: 1 }
 *
 * 注意：调用方（如 service）必须用 readonly string[] 字面量类型当白名单，
 * 这样 TS 编译期就能防止 typo / 漏写。
 */
import { BizCode, BizError } from './errors';

/** 5 种过滤语义 */
export type FilterOp = 'eq' | 'in' | 'contains' | 'gte' | 'lte';

export interface FilterClause {
  field: string;
  op: FilterOp;
  value: any;
}

export type SortDir = 'asc' | 'desc';

export interface SortClause {
  field: string;
  dir: SortDir;
}

/** mongoose filter shape（输出对象顶层） */
export interface ParsedFilter {
  [field: string]: any;
  $and?: Array<Record<string, any>>;
}

/** mongoose sort shape（数字：1 升 / -1 降） */
export interface ParsedSort {
  [field: string]: 1 | -1;
}

const FILTER_OPS: ReadonlySet<FilterOp> = new Set([
  'eq',
  'in',
  'contains',
  'gte',
  'lte',
]);

const SORT_DIRS: ReadonlySet<SortDir> = new Set(['asc', 'desc']);

/**
 * 把单个 FilterClause 转换成 mongoose field 子表达式。
 * 不做白名单检查（外层 parseFilter 统一处理）。
 */
function buildFieldExpr(clause: FilterClause): any {
  switch (clause.op) {
    case 'eq':
      return clause.value;
    case 'in': {
      if (!Array.isArray(clause.value)) {
        throw new BizError(
          BizCode.BAD_REQUEST,
          `op "in" 必须传 array（field=${clause.field}）`
        );
      }
      return { $in: clause.value };
    }
    case 'contains': {
      if (typeof clause.value !== 'string') {
        throw new BizError(
          BizCode.BAD_REQUEST,
          `op "contains" 必须传 string（field=${clause.field}）`
        );
      }
      // 转义正则元字符，避免恶意 regex
      const escaped = clause.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return { $regex: escaped, $options: 'i' };
    }
    case 'gte':
      return { $gte: clause.value };
    case 'lte':
      return { $lte: clause.value };
    default: {
      // 不可达（parseFilter 入口已验过 op），但保留兜底
      const _exhaustive: never = clause.op;
      throw new BizError(
        BizCode.BAD_REQUEST,
        `不支持的搜索操作: ${_exhaustive as string}`
      );
    }
  }
}

/**
 * 把 filter 入参解析成 mongoose filter object。
 *
 * 行为：
 *  - undefined / 空数组 → 返回 {}
 *  - field 不在 allowedFields → throw BizError(400)
 *  - op 非法 → throw BizError(400)
 *  - value 类型与 op 不匹配 → throw BizError(400)
 *  - 同 field 多条：首条走顶层 key，后续条进入 $and 数组
 *    （mongoose 行为：顶层同 key 后写覆盖前写；为了 AND 语义必须分流）
 *
 * @param filter        用户入参（来自 dto.filter）
 * @param allowedFields 服务级白名单（service 静态字段，禁止外部传）
 */
export function parseFilter(
  filter: FilterClause[] | undefined,
  allowedFields: readonly string[]
): ParsedFilter {
  if (!filter || filter.length === 0) return {};

  const allowSet = new Set(allowedFields);
  const result: ParsedFilter = {};
  const andTail: Array<Record<string, any>> = [];
  // 记录每个 field 是否已经写过顶层 key；写过的再出现的去 $and
  const seenTopLevel = new Set<string>();

  for (let i = 0; i < filter.length; i++) {
    const c = filter[i];

    if (!c || typeof c !== 'object') {
      throw new BizError(
        BizCode.BAD_REQUEST,
        `filter[${i}] 必须是对象`
      );
    }

    // field 白名单
    if (typeof c.field !== 'string' || !allowSet.has(c.field)) {
      throw new BizError(
        BizCode.BAD_REQUEST,
        `不支持的搜索字段: ${String(c.field)}`
      );
    }

    // op 合法性
    if (!FILTER_OPS.has(c.op)) {
      throw new BizError(
        BizCode.BAD_REQUEST,
        `不支持的搜索操作: ${c.op}（field=${c.field}）`
      );
    }

    const expr = buildFieldExpr(c);

    if (!seenTopLevel.has(c.field)) {
      // 首条 → 顶层
      result[c.field] = expr;
      seenTopLevel.add(c.field);
    } else {
      // 同 field 第二条及以后 → 进 $and（与首条 AND 关系）
      andTail.push({ [c.field]: expr });
    }
  }

  if (andTail.length > 0) {
    result.$and = andTail;
  }

  return result;
}

/**
 * 把 sort 入参解析成 mongoose sort object。
 *
 * 行为：
 *  - undefined / 空数组 → 返回 {}
 *  - field 不在 allowedFields → throw BizError(400)
 *  - dir 非法 → throw BizError(400)
 *  - 同 field 多条：后写覆盖前写（mongoose 行为）
 *  - 多 field 按数组顺序累加，e.g. [{time,desc},{_id,asc}] → {time:-1,_id:1}
 *
 * @param sort          用户入参（来自 dto.sort）
 * @param allowedFields 服务级白名单
 */
export function parseSort(
  sort: SortClause[] | undefined,
  allowedFields: readonly string[]
): ParsedSort {
  if (!sort || sort.length === 0) return {};

  const allowSet = new Set(allowedFields);
  const result: ParsedSort = {};

  for (let i = 0; i < sort.length; i++) {
    const s = sort[i];

    if (!s || typeof s !== 'object') {
      throw new BizError(
        BizCode.BAD_REQUEST,
        `sort[${i}] 必须是对象`
      );
    }

    if (typeof s.field !== 'string' || !allowSet.has(s.field)) {
      throw new BizError(
        BizCode.BAD_REQUEST,
        `不支持的排序字段: ${String(s.field)}`
      );
    }

    if (!SORT_DIRS.has(s.dir)) {
      throw new BizError(
        BizCode.BAD_REQUEST,
        `不支持的排序方向: ${s.dir}（field=${s.field}）`
      );
    }

    result[s.field] = s.dir === 'asc' ? 1 : -1;
  }

  return result;
}
