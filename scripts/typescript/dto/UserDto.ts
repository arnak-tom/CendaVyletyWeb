export class UserDto 
{
    name: string;
    email: string;
    pictureUrl: string;

    createdAt: Date;
    roles: string[];

    constructor(
        name: string, 
        email: string, 
        pictureUrl: string, 
        createdAt: Date, 
        roles: string[]) 
    {
        this.name       = name;
        this.email      = email;
        this.pictureUrl = pictureUrl;

        this.createdAt = createdAt;
        this.roles     = roles;
    }
}