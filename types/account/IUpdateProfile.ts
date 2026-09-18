export interface IUpdateProfile {
    firstName: string;
    lastName: string;
    phone: string;
    avatar: {
        uri: string;
        type?: string;
        name?: string;
    } | null;
}
