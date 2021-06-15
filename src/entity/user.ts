import { prop } from "@midwayjs/typegoose"

export class User {
    @prop({ type: String, required: true })
    public user: string

    @prop()
    public name: string

    @prop()
    public passwd: string

    @prop({ default: "user" })
    public userGroup: string

    @prop()
    public avanter: string

    @prop()
    public company: string


}