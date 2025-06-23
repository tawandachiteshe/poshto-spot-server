export interface GetVoucherDto {
  id: number;
  code: string;
  dataCapBytes: number;
  price: number;
  timeCapSeconds: number;
  isActive: boolean;
  createdAt: Date;
  expiry: Date;
  expiryDays: number;
}
