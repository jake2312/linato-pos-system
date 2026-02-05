import "axios";

declare module "axios" {
  export interface AxiosRequestConfig<D = any> {
    skipToast?: boolean;
  }
}
