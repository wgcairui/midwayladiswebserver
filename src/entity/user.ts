import { modelOptions, prop } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { timestamps: true } })
export class User {
  @prop({ required: true, index: true })
  public user: string;

  @prop()
  public name: string;

  @prop()
  public passwd: string;

  @prop({ default: 'user' })
  public userGroup: string;

  @prop()
  public avanter: string;

  @prop()
  public company: string;
}
