export class ApiError extends Error {
    status: number;
    statusText: string;
    errorText: string;
  
    constructor(status: number, statusText: string, errorText: string) {
      super(`${status} ${statusText}: ${errorText}`);
      this.status = status;
      this.statusText = statusText;
      this.errorText = errorText;
      Object.setPrototypeOf(this, ApiError.prototype);
    }
  }
  