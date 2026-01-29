declare module "@prisma/client" {
  export class PrismaClient {
    constructor(options?: any);
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    user: any;
    patient: any;
    [key: string]: any;
  }
}
