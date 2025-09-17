import { ApiResponseKey } from "src/enums/api-response-key.enum";
import { HttpStatus } from "@nestjs/common";

export class ApiResponse {
  
    private static getTimestamp(): string {
        return new Date().toISOString();
        // Nó chuyển đối tượng Date thành chuỗi (string) 
        // theo định dạng ISO 8601 (chuẩn quốc tế về ngày giờ)
    }

    static ok<T> (data: T, message: string = '', httpStatus: HttpStatus = HttpStatus.OK ): Record<string, any> {
        return {
          [ApiResponseKey.STATUS]: true,
          [ApiResponseKey.CODE]: HttpStatus.OK, // HttpStatus.OK là mã 200 thành công 
          [ApiResponseKey.DATA]: data,
          [ApiResponseKey.MESSAGE]: message,
          [ApiResponseKey.TIMESTAMP]: this.getTimestamp() // toISOString chuyển về định dạng thời gian chuẩn quốc tế
        }
    };

    static error<T>(error: T, message: string = '', httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR): Record<string, unknown> {
        return {
          [ApiResponseKey.STATUS]: false,
          [ApiResponseKey.CODE]: httpStatus,
          [ApiResponseKey.ERROR]: error,
          [ApiResponseKey.MESSAGE]: message,
          [ApiResponseKey.TIMESTAMP]: this.getTimestamp()
        }
    }

    static message(
        message: string,
        httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    ): Record<string, unknown> {
        return {
            [ApiResponseKey.STATUS]: httpStatus === HttpStatus.OK 
                                     || httpStatus === HttpStatus.CREATED,
            [ApiResponseKey.MESSAGE]: message,
            [ApiResponseKey.TIMESTAMP]: this.getTimestamp(),
            [ApiResponseKey.CODE]: httpStatus,
        }
    }
    

 
   


}
