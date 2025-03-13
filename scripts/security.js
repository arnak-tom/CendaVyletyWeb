import { db } from "./firebase-config.js";
import { getDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { UserDto } from "./typescript/dto/UserDto.js";

export class JourneyWebSecurity
{
    static parseJwt(token) 
    {
        const base64Url = token.split('.')[1];

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) 
        {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    }

    static updateSigninStatus() 
    {
        const idToken = sessionStorage.getItem('idToken');

        const userDto = JSON.parse(sessionStorage.getItem("user"));

        if (!idToken || !userDto)
        {
            JourneyWebSecurity.signOut();

            return;
        }

        const signinButton = document.getElementById('google-login-button');

        const userPhoto = userDto.pictureUrl
            ? `<img id="user-photo" src="${userDto.pictureUrl}" alt="Profilový obrázek" style="width: 32px; height: 32px; border-radius: 20%; margin-right: 10px;">`
            : "";

        JourneyWebSecurity.enableOrDisableAdminSections();

        if (userDto.name) 
        {
            sessionStorage.setItem('userTitle', userDto.name);

            const userTitle = userDto.roles && userDto.roles.includes("admin")
                ? `${userDto.name} (admin)`
                : userDto.name;

            signinButton.innerHTML = `
            <div style='display: flex; flex-direction: column; align-items: flex-end;'>
                <div style='display: flex; align-items: center; width: 100%; margin-bottom: 10px;'>
                    ${userPhoto}
                    <div>${userTitle}</div>
                </div>
                <button id='logout-button' style='align-self: flex-end;'">Odhlásit se</button>
            </div>
          `;

            const logoutButton = document.getElementById('logout-button');

            logoutButton.addEventListener("click", () => 
            {
                JourneyWebSecurity.signOut();
            });
        }
    }

    static async handleCredentialResponse(response) 
    {
        const idToken = response.credential;

        console.log("ID Token: " + idToken);

        sessionStorage.setItem('idToken', idToken);

        const userObject = JourneyWebSecurity.parseJwt(response.credential);

        if (userObject)
        {
            const userDto = await JourneyWebSecurity.ensureUserAsync(userObject);

            sessionStorage.setItem('user', JSON.stringify(userDto));

            JourneyWebSecurity.updateSigninStatus();
        }
    }

    static signOut() 
    {
        // Odstranění uživatelských informací ze sessionStorage
        sessionStorage.removeItem('idToken');
        sessionStorage.removeItem('userTitle');

        JourneyWebSecurity.enableOrDisableAdminSections();

        google.accounts.id.disableAutoSelect();

        // Obnovení původního tlačítka pro přihlášení
        google.accounts.id.renderButton(
          document.getElementById('google-login-button'),
          { theme: 'outline', size: 'large' }
        );
    }

    static enableOrDisableAdminSections()
    {
        const idToken = sessionStorage.getItem('idToken');

        const userDto = JSON.parse(sessionStorage.getItem("user"));

        if (!idToken || (!userDto || !userDto.roles || !userDto.roles.includes("admin")))
        {
            document.querySelectorAll(".admin-section").forEach( item => 
            {
                if (!item.classList.contains("hidden"))
                {
                    item.classList.add("hidden");
                }
            });
        }
        else
        {
            document.querySelectorAll(".admin-section").forEach( item => 
            {
                if (item.classList.contains("hidden"))
                {
                    item.classList.remove("hidden");
                }
            });
        }
    }

    static async ensureUserAsync(userObject)
    {
        const userRef = doc(db, "users", userObject.sub);

        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) 
        {
            const createdAt = new Date();

            await setDoc(userRef, 
            {
                email: userObject.email,
                name: userObject.name,
                picture: userObject.picture,
                roles: ["reader"],
                createdAt: createdAt
            });

            console.log("Uživatel byl přidán do Firestore");

            const userDto = new UserDto(userObject.name, userObject.email, userObject.picture, createdAt, ["reader"]);

            return userDto;
        } 
        else 
        {
            const userData = userSnap.data();

            console.log("Uživatel už existuje");

            const userDto = new UserDto(userData.name, userData.email, userData.picture, userData.createdAt, userData.roles);

            return userDto;
        }
    }
}

document.addEventListener("DOMContentLoaded", () => 
{
    google.accounts.id.initialize(
    {
        client_id: "956516295528-c2pd3qrkaac71ace0qh7hgqkfm1pljir.apps.googleusercontent.com",
        callback: JourneyWebSecurity.handleCredentialResponse
    });

    const idToken = sessionStorage.getItem("idToken");

    if (idToken) 
    {
        JourneyWebSecurity.updateSigninStatus();
    }
    else
    {
        google.accounts.id.renderButton(
            document.getElementById("google-login-button"),
            { theme: "outline", size: "large" }
        );
    }
});