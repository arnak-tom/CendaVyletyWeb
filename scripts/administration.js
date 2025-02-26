import { db } from "./firebase-config.js";
import { collection, getDoc, getDocs, updateDoc, doc, addDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


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
        const journeysCollection = collection(db, "journeys");

        const journeysQuery = query(journeysCollection, orderBy("journeyId", "asc"));

        const journeysDocs = await getDocs(journeysQuery);

        const table = document.getElementById("dataTable");

        table.innerHTML = "";

        journeysDocs.forEach(doc => 
        {
            const journey = doc.data();

            table.innerHTML += `
                <tr data-item-id="${doc.id}">
                    <td>${journey.journeyId}</td>
                    <td>${journey.year}</td>
                    <td>${journey.journeyDate ? this.#formatFirestoreTimestampForDisplay(journey.journeyDate) : ''}</td>
                    <td>${journey.title}</td>
                    <td>${journey.status}</td>
                    <td>
                        <button class="edit-button" data-doc-id="${doc.id}">✏️</button>
                        <button class="delete-button" data-doc-id="${doc.id}" data-title="${journey.title}" >🗑️</button>
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
}