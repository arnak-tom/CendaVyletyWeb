import { db } from "./firebase-config.js";
import { Firebase } from "./firebase.js";
import { collection, getDoc, getDocs, updateDoc, doc, addDoc, deleteDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


export class Administration
{
    static #instance;

    constructor() 
    {
        if (Administration.#instance) 
        {
            return Administration.#instance;
        }

        Administration.#instance = this;

        this.#addEventListeners();
    }

    // Načtení dat
    async loadJourneysTableData() 
    {
        const journeysTable = document.getElementById("journeys-table");

        const year = journeysTable.dataset.year;

        const orderByConditions = [["journeyDate", "asc"]];

        const whereConditions = year 
            ? this.getJourneyYearCondition(year)
            : [];

        const journeysData = await Firebase.readDataAsync("journeys", whereConditions, orderByConditions);

        this.#populateJourneysTable("dataTable", journeysData);
    }

    #populateJourneysTable(tbodyId, journeysData)
    {
        const tbody = document.getElementById(tbodyId);

        tbody.innerHTML = "";

        journeysData.forEach(journey => 
        {
            tbody.innerHTML += `
                <tr data-item-id="${journey.docId}">
                    <td>${journey.journeyDate ? this.#formatFirestoreTimestampForDisplay(journey.journeyDate) : ''}</td>
                    <td>${journey.title}</td>
                    <td style='text-align: right;'>${journey.routeLength ?? ''} km</td>
                    <td style='text-align: right;'>${journey.metersClimbed ?? ''} m</td>
                    <td style='text-align: right;'>${journey.altitudeLowest ?? ''} m</td>
                    <td style='text-align: right;'>${journey.altitudeHighest ?? ''} m</td>
                    <td>${journey.status}</td>
                    <td>
                        <button class="edit-button" data-doc-id="${journey.docId}">✏️</button>
                        <button class="delete-button" data-doc-id="${journey.docId}" data-title="${journey.title}" >🗑️</button>
                    </td>
                </tr>`;
        });
    }

    #addEventListeners()
    {
        // Přidání / Aktualizace dat
        document.getElementById("dataForm").addEventListener("submit", async (e) =>
        {
            e.preventDefault();

            const docId = document.getElementById("docId").value;

            const data = 
            {
                journeyId: document.getElementById("journeyId").value,
                journeyDate: new Date(document.getElementById("journeyDate").value),
                year: new Date(document.getElementById("journeyDate").value).getFullYear(),
                title: document.getElementById("journeyTitle").value,
                routeLength: document.getElementById("routeLength").value,
                metersClimbed: document.getElementById("metersClimbed").value,
                altitudeLowest: document.getElementById("altitudeLowest").value,
                altitudeHighest: document.getElementById("altitudeHighest").value,
                status: document.getElementById("status").value
            };

            if (docId) 
            {
                try 
                {
                    const docRef = doc(db, "journeys", docId);

                    await updateDoc(docRef, data);

                    console.log("Dokument úspěšně aktualizován!");

                    this.#resetForm();

                    await this.loadJourneysTableData();
                } 
                catch (error) 
                {
                    console.error("Chyba při aktualizaci:", error);
                }
            } 
            else 
            {
                await addDoc(collection(db, "journeys"), data);

                this.#resetForm();

                await Administration.#instance.loadJourneysTableData();
            }

            
        });

        document.getElementById("journeys-table").addEventListener("click", (event) => 
        {
            if (event.target.classList.contains("edit-button")) 
            {
                this.#populateForm(event.target.dataset.docId);
            }
            else if (event.target.classList.contains("delete-button")) 
            {
                this.#confirmDelete(event.target.dataset.docId, event.target.dataset.title);
            }
        });

        document.getElementById('cancelButton').addEventListener('click', this.#hideModal);

        document.getElementById('confirmButton').addEventListener('click', async () =>
        {
            await this.#deleteJourney(document.getElementById("itemToDelete-title").dataset.itemId);
        });

        document.getElementById('export-journeys-from-firebase-button').addEventListener('click', async () =>
        {
            await this.#exportCollection("journeys");
        });

        document.getElementById("import-journeys-file").addEventListener("change", async (e) => 
        {
            await this.#importCollection(e, "journeys-imported") ;
        });

        document.getElementById("journeys-table-years-switch").addEventListener("click", (event) => 
        {
            if (event.target.classList.contains("switch-item")) 
            {
                const year = event.target.dataset.year;

                const journeysTable = document.getElementById("journeys-table");

                journeysTable.dataset.year = year ?? "";

                this.loadJourneysTableData();

                document.querySelectorAll("#journeys-table-years-switch .switch-item")
                    .forEach((switchItem) => 
                    {
                        switchItem.classList.remove("current");
                    });

                event.target.classList.add("current");
            }
        });
    }

    // Reset formuláře
    #resetForm() 
    {
        document.getElementById("dataForm").reset();
        document.getElementById("docId").value = "";
    }

    // Úprava záznamu
    async #populateForm(docId) 
    {
        const journey = await this.#getFireBaseDocumentById("journeys", docId);

        document.getElementById("docId").value = docId;
        document.getElementById("journeyId").value = journey.journeyId;
        document.getElementById("journeyDate").value = this.#formatFirestoreTimestampForForm(journey.journeyDate);
        document.getElementById("journeyTitle").value = journey.title;
        document.getElementById("routeLength").value = journey.routeLength;
        document.getElementById("metersClimbed").value = journey.metersClimbed;
        document.getElementById("altitudeLowest").value = journey.altitudeLowest;
        document.getElementById("altitudeHighest").value = journey.altitudeHighest;
        document.getElementById("status").value = journey.status;
    }
    
    #confirmDelete(id, title)
    {
        document.getElementById("itemToDelete-title").innerHTML = title;
        document.getElementById("itemToDelete-title").dataset.itemId = id;

        this.#showModal();
    }

    // Mazání záznamu
    async #deleteJourney(docId) 
    {
        const docRef = doc(db, "journeys", docId); // Odkaz na konkrétní dokument

        try 
        {
            await deleteDoc(docRef);

            document.querySelector(`#dataTable tr[data-item-id="${docId}"]`).remove();

            this.#resetForm();

            console.log("Dokument úspěšně smazán:", docId);
        } 
        catch (error) 
        {
            console.error("Chyba při mazání dokumentu:", error);
        }

        this.#hideModal();
    }

    // Funkce pro zobrazení modálního okna
    #showModal() 
    {
        modalOverlay.style.display = 'flex';
    }
  
    // Funkce pro skrytí modálního okna
    #hideModal() 
    {
        modalOverlay.style.display = 'none';
    }

    #formatFirestoreTimestampForDisplay(firestoreTimestamp) 
    {
        const date = new Date(firestoreTimestamp.seconds * 1000); // Převod sekund na milisekundy

        const day = String(date.getDate()).padStart(2, '0');

        const month = String(date.getMonth() + 1).padStart(2, '0'); // Měsíce jsou indexovány od 0

        const year = date.getFullYear();

        return `${day}.${month}.${year}`;
    }

    #formatFirestoreTimestampForForm(timestamp) 
    {
        if (!timestamp)
        {
            return "";
        }

        const date = new Date(timestamp.seconds * 1000); // Převod sekund na milisekundy

        const year = date.getFullYear();

        const month = String(date.getMonth() + 1).padStart(2, '0'); // Měsíce jsou indexovány od 0

        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    async #getFireBaseDocumentById(collectionName, docId) 
    {
        try 
        {
            const docRef = doc(db, collectionName, docId);

            const docSnap = await getDoc(docRef);

            if (docSnap.exists) 
            {
                console.log("Data dokumentu:", docSnap.data());
                return docSnap.data();
            } else {
            console.log("Dokument neexistuje.");
            return null;
            }
        } 
        catch (error) 
        {
            console.error("Chyba při načítání dokumentu:", error);
        }
    }

    async #exportCollection(collectionName) 
    {
        const querySnapshot = await getDocs(collection(db, collectionName));

        const data = [];
    
        querySnapshot.forEach(doc => 
        {
            data.push({ id: doc.id, ...doc.data() }); // Uloží ID + data
        });
    
        const jsonData = JSON.stringify(data, null, 2); // Krásně formátovaný JSON
    
        // Vytvoříme soubor ke stažení
        const blob = new Blob([jsonData], { type: "application/json" });

        const a = document.createElement("a");

        a.href = URL.createObjectURL(blob);

        a.download = `${collectionName}-backup.json`;

        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);
    }

    async #importCollection(event, collectionName) 
    {
        const file = event.target.files[0];

        if (!file) return;
    
        const reader = new FileReader();

        reader.onload = async function(event) 
        {
            const jsonData = JSON.parse(event.target.result);
    
            for (const item of jsonData) 
            {
                const { id, ...data } = item; // ID ignorujeme (Firestore ho vytvoří sám)

                await addDoc(collection(db, collectionName), data);
            }
    
            alert("Data byla úspěšně obnovena!");
        };

        reader.readAsText(file);
    }








    getJourneyYearCondition(year)
    {
        const startOfYear = new Date(`${year}-01-01T00:00:00Z`);
        const endOfYear = new Date(`${year}-12-31T23:59:59Z`);

        return [["journeyDate", ">=", startOfYear], ["journeyDate", "<=", endOfYear]]
    }





 
   
    
}