import { prop } from "@midwayjs/typegoose"

export class User {
    @prop({ type: String, required: true })
    public user: string

    @prop()
    public name: string

    @prop()
    public passwd: string

    @prop()
    public tel?: number

    @prop()
    public mail?: string

    @prop({ default: new Date() })
    public DateTime: Date

    @prop({ default: false })
    public stat: boolean

    @prop({ default: "user" })
    public Group: string

    @prop()
    public IP?: string

    
}