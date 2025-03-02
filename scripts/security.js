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

        const userObject = JourneyWebSecurity.parseJwt(idToken);

        const userTitle = userObject.name;

        const signinButton = document.getElementById('google-login-button');

        const userPhoto = userObject.picture
            ? `<img id="user-photo" src="${userObject.picture}" alt="Profilový obrázek" style="width: 32px; height: 32px; border-radius: 20%; margin-right: 10px;">`
            : "";

        document.getElementById('logged-user-stripe').classList.remove("hidden");

        if (userTitle) 
        {
            sessionStorage.setItem('userTitle', userTitle);

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

    static handleCredentialResponse(response) 
    {
        const idToken = response.credential;

        console.log("ID Token: " + idToken);

        sessionStorage.setItem('idToken', idToken);

        const userObject = JourneyWebSecurity.parseJwt(response.credential);

        if (userObject)
        {
            JourneyWebSecurity.updateSigninStatus();
        }
    }

    static signOut() 
    {
        // Odstranění uživatelských informací ze sessionStorage
        sessionStorage.removeItem('idToken');
        sessionStorage.removeItem('userTitle');

        document.getElementById('logged-user-stripe').classList.add("hidden");

        google.accounts.id.disableAutoSelect();

        // Obnovení původního tlačítka pro přihlášení
        google.accounts.id.renderButton(
          document.getElementById('google-login-button'),
          { theme: 'outline', size: 'large' }
        );
    }
}

// window.onload = function () 
// {
//     google.accounts.id.initialize(
//     {
//         client_id: "956516295528-c2pd3qrkaac71ace0qh7hgqkfm1pljir.apps.googleusercontent.com",
//         callback: JourneyWebSecurity.handleCredentialResponse
//     });

//     google.accounts.id.renderButton(
//         document.getElementById("google-login-button"),
//         { theme: "outline", size: "large" }
//     );
// };

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