import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/decorator';
import { CacheManager } from '@midwayjs/cache';

/**
 * 全局缓存
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class Cache {
  @Inject()
  cache: CacheManager;

  async set(key: string, val: string | object, options?: { ttl: number }) {
    const data = typeof val === 'string' ? val : JSON.stringify(val);
    await this.cache.set(key.toString(), data, { ttl: options?.ttl || 60 });
  }

  async get<T = string>(key: string) {
    const data = (await this.cache.get(key.toString())) as any;
    if (data && /^{.*}$/.test(data)) {
      return JSON.parse(data) as T;
    } else {
      return data as T;
    }
  }

  async clear() {
    return await this.cache.reset();
  }

  async del(key: string) {
    return await this.cache.del(key);
  }
}
