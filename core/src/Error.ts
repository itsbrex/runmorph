export class MorphError {
  object: "error";
  code: string;
  message?: string;

  constructor(params: { code: string; message?: string }) {
    this.object = "error";
    this.code = params.code;
    this.message = params.message;
  }

  toJSON(): { object: string; code: string; message?: string } {
    return {
      object: this.object,
      code: this.code,
      message: this.message,
    };
  }
}
