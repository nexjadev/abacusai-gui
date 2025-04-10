export interface User {
    userId: number;
    username: string;
    name: string;
    email: string;
    isActive: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
