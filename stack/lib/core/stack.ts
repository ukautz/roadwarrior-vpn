import { TerraformStack } from "cdktf";
import { App } from "./app";

export abstract class Stack extends TerraformStack {
  protected app: App;
  protected context: (key: string, fallback?: string) => string;

  constructor(app: App, name: string) {
    super(app, name);
    this.app = app;
    this.context = app.context;
  }
}
