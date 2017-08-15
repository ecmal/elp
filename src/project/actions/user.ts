import {User, UserStatus} from "../models/user";

export class Users {
    static id = 4;
    static map: Dictionary<User> = {
        arman: new User({
            id: 1,
            username: 'arman',
            firstName: 'Arman',
            lastName: 'Simonyan',
            email: 'arman.simonyan@mamble.co',
            password: 'hehe',
            phone: '+374 98 653285',
            status: UserStatus.ACTIVE,
        }),
        sergey: new User({
            id: 2,
            username: 'sergey',
            firstName: 'Sergey',
            lastName: 'Mamyan',
            email: 'sergey@mamble.co',
            password: 'hehe',
            phone: '+374 98 854562',
            status: UserStatus.ACTIVE,
        }),
        helen: new User({
            id: 3,
            username: 'helen',
            firstName: 'Helen',
            lastName: 'Akunts',
            email: 'helenak@gmail.com',
            password: 'he11en',
            phone: '+374 98 653855',
            status: UserStatus.DISABLED,
        })
    };

    static list(filter: (u) => boolean) {
        return Object.keys(Users.map).filter(k => filter(Users.map[k])).map(u => Users.map[u])
    }

    async getUsers(status?: UserStatus) {
        console.info('getUsers',status);
        return Users.list(u => {
            return (!status || u.status == status);
        })
    }

    async createUser(user: User) {
        user.id = Users.id++;
        return Users.map[user.username] = user;
    }

    async getUser(username: string) {
        return Users.map[username];
    }

    async updateUser(username: string, user: User) {
        return Object.assign(Users.map[username], user);
    }

    async deleteUser(username: string) {
        delete Users.map[username]
    }
}