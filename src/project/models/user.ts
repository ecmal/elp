export enum UserStatus {
    ACTIVE = 'active',
    DISABLED = 'disabled'
}

export class User {

    public id: number;
    public username: string;
    public firstName: string;
    public lastName: string;
    public email?: string;
    public password?: string;
    public phone?: string;
    public status?: UserStatus;

    constructor(user: User) {
        Object.assign(this, user);
    }
}
