export class ExecResult<T> {
  data: T;
  step = 1;
  stepCount: number;
  progress = 0;
  error = {
    code: 0,
    message: "",
  };
  constructor(stepCount: number) {
    this.stepCount = stepCount;
  }
}
