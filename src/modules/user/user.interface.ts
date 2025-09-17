export interface User {
    id: bigint,
    email: string,
    password: string, 
    name: string,
    phone: string | null,
    createdAt: Date, 
    updateAt: Date
}

export type UserWithoutPassword = Omit<User, 'password'>


