export interface IUserPayment {
    balance: number;
    payments: {
        companyName: string;
        amount: number;
        createdAt: string;
    }[]
}