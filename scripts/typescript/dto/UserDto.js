export class UserDto {
    constructor(name, email, pictureUrl, createdAt, roles) {
        this.name = name;
        this.email = email;
        this.pictureUrl = pictureUrl;
        this.createdAt = createdAt;
        this.roles = roles;
    }
}
