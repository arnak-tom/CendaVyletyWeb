import { db } from "./firebase-config.js";
import { Firebase } from "./firebase.js";
import { ConvertUtil } from "./convert-util.js";
import { Whisperer } from "./whisperer.js";
import { RichTextEditor } from "./typescript/components/RichTextEditor.js";
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc, Timestamp  } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


export class Administration
{
    static #instance;

    constructor() 
    {
        if (Administration.#instance) 
        {
            return Administration.#instance;
        }

        this.journeyMemberWhisperer = new Whisperer("journey-members", "journeyMember", "journeyMemberSuggestions", "journeyMemberSelected");

        this.journeyMemberWhisperer.loadData();

        this.routePointWhisperer = new Whisperer("route-points", "journeyRoutePoint", "journeyRoutePointSuggestions", "journeyRoutePointsSelected");

        this.routePointWhisperer.loadData();

        this.restaurantEditor = new RichTextEditor("rich-text-editor-restaurant");

        this.restaurantEditor.setContent("<p>Kdepak jsme se občerstvili?</p>");

        this.storyEditor = new RichTextEditor("rich-text-editor-story");

        this.storyEditor.setContent("<p>Jak to šlo?</p>");

        Administration.#instance = this;
    }

    // Načtení dat
    async loadJourneysTableDataAsync() 
    {
        const journeysTable = document.getElementById("journeys-table");

        const year = journeysTable.dataset.year;

        const whereConditions = year 
            ? this.#getJourneyYearCondition(year)
            : [];

        const sortColumn = journeysTable.dataset.sortColumn;

        const sortDirection = journeysTable.dataset.sortDirection;

        const orderByConditions = [[sortColumn, sortDirection]];

        const journeysData = await Firebase.readDataAsync("journeys", whereConditions, orderByConditions);

        this.#populateJourneysTable("dataTable", journeysData);
    }

    #populateJourneysTable(tbodyId, journeysData)
    {
        const idToken = sessionStorage.getItem('idToken');

        const adminSectionClass = idToken ? "admin-section" : "admin-section hidden";

        const tbody = document.getElementById(tbodyId);

        tbody.innerHTML = "";

        journeysData.forEach(journey => 
        {
            tbody.innerHTML += `
                <tr data-item-id="${journey.docId}">
                    <td class='mobile-hidden-section'></td>
                    <td>${journey.journeyDate ? ConvertUtil.formatFirestoreTimestampForDisplay(journey.journeyDate) : ''}</td>
                    <td>${journey.title}</td>
                    <td style='text-align: right;'>${journey.routeLength ?? ''} km</td>
                    <td class='mobile-hidden-section' style='text-align: right;'>${journey.metersClimbed ?? ''} m</td>
                    <td class='mobile-hidden-section' style='text-align: right;'>${journey.altitudeLowest ?? ''} m</td>
                    <td class='mobile-hidden-section' style='text-align: right;'>${journey.altitudeHighest ?? ''} m</td>
                    <td class='mobile-hidden-section' style='text-align: center;'>${journey.photoGalleryItems && journey.photoGalleryItems.length ? journey.photoGalleryItems.length : ""}</td>
                    <td class="${adminSectionClass} mobile-hidden-section">
                        <button class="edit-button" data-doc-id="${journey.docId}">✏️</button>
                        <button class="delete-button" data-doc-id="${journey.docId}" data-title="${journey.title}" >🗑️</button>
                    </td>
                </tr>`;
        });
    }

    addEventListeners()
    {
        // Přidání / Aktualizace dat
        document.getElementById("dataForm").addEventListener("submit", async (e) =>
        {
            e.preventDefault();

            await this.#submitJourneyForm();
        });

        document.getElementById("reset-journey-form-button").addEventListener("click", () => 
        {
            this.#resetForm();
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
            else if (event.target.classList.contains("sort-button")) 
            {
                this.#sortJourneys(event.target);
            }
            else if (event.target.classList.contains("sort-button-img") || event.target.classList.contains("sort-icon")) 
            {
                this.#sortJourneys(event.target.closest(".sort-button"));
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
            // await this.#importCollection(e, "journeys") ;
        });

        document.getElementById("journeys-table-years-switch").addEventListener("click", (event) => 
        {
            if (event.target.classList.contains("switch-item")) 
            {
                const year = event.target.dataset.year;

                const journeysTable = document.getElementById("journeys-table");

                journeysTable.dataset.year = year ?? "";

                this.loadJourneysTableDataAsync();

                document.querySelectorAll("#journeys-table-years-switch .switch-item")
                    .forEach((switchItem) => 
                    {
                        switchItem.classList.remove("current");
                    });

                event.target.classList.add("current");
            }
        });

        document.getElementById("add-photo-gallery-item-button").addEventListener("click", (event) => 
        {
            this.#addPhotoGalleryItem();
        });
    }

    async #submitJourneyForm()
    {
        const docId = document.getElementById("docId").value;

        const urls = document.querySelectorAll('input[name="url[]"]');
        const descriptions = document.querySelectorAll('input[name="description[]"]');

        const photoData = [];

        if (urls && descriptions)
        {
            urls.forEach((urlInput, index) => 
            {
                const urlValue = urlInput.value.trim();

                const descriptionValue = descriptions[index]?.value.trim();

                if (urlValue) 
                {
                    photoData.push(
                    {
                        url: urlValue,
                        description: descriptionValue ?? null
                    });
                }
            });
        }

        const routePoints = Array.from(document.querySelectorAll("#journeyRoutePointsSelected li")).map(li => li.firstChild.textContent.trim());

        const journeyMembers = Array.from(document.querySelectorAll("#journeyMemberSelected li")).map(li => li.firstChild.textContent.trim());
            
        const data = 
        {
            journeyId: document.getElementById("journeyId").value,
            journeyDate: new Date(document.getElementById("journeyDate").value),
            year: new Date(document.getElementById("journeyDate").value).getFullYear(),
            title: document.getElementById("journeyTitle").value,
            journeyMembers: journeyMembers,
            routeLength:     ConvertUtil.convertToNumberOrNull( document.getElementById("routeLength").value ),
            metersClimbed:   ConvertUtil.convertToNumberOrNull( document.getElementById("metersClimbed").value ),
            altitudeLowest:  ConvertUtil.convertToNumberOrNull( document.getElementById("altitudeLowest").value ),
            altitudeHighest: ConvertUtil.convertToNumberOrNull( document.getElementById("altitudeHighest").value ),
            photoGalleryThumbnailUrl: document.getElementById("photoGalleryThumbnailUrl").value?.trim(),
            journeyRouteThumbnailUrl: document.getElementById("journeyRouteThumbnailUrl").value?.trim(),
            journeyRouteUrl: document.getElementById("journeyRouteUrl").value?.trim(),
            photoGalleryItems: photoData,
            routePoints : routePoints,
            restaurantsHtml : this.restaurantEditor.getContent(),
            storyHtml : this.storyEditor.getContent(),
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

                await this.loadJourneysTableDataAsync();
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

            await this.loadJourneysTableDataAsync();
        }
    }

    #addPhotoGalleryItem(url, description)
    {
        const template = document.getElementById("photo-gallery-item-template");

        const container = document.getElementById("photo-gallery-items");

        const div = document.createElement("div");

        div.classList.add("item");

        const clone = template.content.cloneNode(true);

        if (url)
        {
            clone.querySelector('input[name="url[]"]').value = url;
        }

        if (description)
        {
            clone.querySelector('input[name="description[]"]').value = description;
        }

        div.appendChild(clone.firstElementChild);
        
        container.appendChild(div);
    }

    // Reset formuláře
    #resetForm() 
    {
        document.getElementById("dataForm").reset();
        document.getElementById("docId").value = "";
        document.getElementById("photo-gallery-items").innerHTML = "";
        document.getElementById("journeyMemberSuggestions").innerHTML = "";
        document.getElementById("journeyMemberSelected").innerHTML = "";
        document.getElementById("journeyRoutePointSuggestions").innerHTML = "";
        document.getElementById("journeyRoutePointsSelected").innerHTML = "";

        this.journeyMemberWhisperer.removeAllSelectedItems();
        this.routePointWhisperer.removeAllSelectedItems();

        this.restaurantEditor.setContent("");
        this.storyEditor.setContent("");
    }

    // Úprava záznamu
    async #populateForm(docId) 
    {
        const journey = await Firebase.readDocumentByIdAsync("journeys", docId); 

        document.getElementById("docId").value = docId;
        document.getElementById("journeyId").value = journey.journeyId;
        document.getElementById("journeyDate").value = ConvertUtil.formatFirestoreTimestampForForm(journey.journeyDate);
        document.getElementById("journeyTitle").value = journey.title;
        document.getElementById("routeLength").value = journey.routeLength;
        document.getElementById("metersClimbed").value = journey.metersClimbed;
        document.getElementById("altitudeLowest").value = journey.altitudeLowest;
        document.getElementById("altitudeHighest").value = journey.altitudeHighest;
        document.getElementById("photoGalleryThumbnailUrl").value = journey.photoGalleryThumbnailUrl ?? "";
        document.getElementById("journeyRouteThumbnailUrl").value = journey.journeyRouteThumbnailUrl ?? "";
        document.getElementById("journeyRouteUrl").value = journey.journeyRouteUrl ?? "";
        document.getElementById("status").value = journey.status;

        document.getElementById("photo-gallery-items").innerHTML = "";

        if (journey.photoGalleryItems)
        {
            journey.photoGalleryItems.forEach(i => 
            {
                this.#addPhotoGalleryItem(i.url, i.description);
            });
        }

        this.journeyMemberWhisperer.removeAllSelectedItems();

        document.getElementById("journeyMemberSelected").innerHTML = "";

        if (journey.journeyMembers)
        {
            journey.journeyMembers.forEach(rp => 
            {
                this.journeyMemberWhisperer.addSelectedItem(rp);
            });
        }

        this.routePointWhisperer.removeAllSelectedItems();

        document.getElementById("journeyRoutePointsSelected").innerHTML = "";

        if (journey.routePoints)
        {
            journey.routePoints.forEach(rp => 
            {
                this.routePointWhisperer.addSelectedItem(rp);
            });
        }

        if (journey.restaurantsHtml)
        {
            this.restaurantEditor.setContent(journey.restaurantsHtml);
        }

        if (journey.storyHtml)
        {
            this.storyEditor.setContent(journey.storyHtml);
        }
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

    async #exportCollection(collectionName) 
    {
        const querySnapshot = await getDocs(collection(db, collectionName));

        const data = querySnapshot.docs.map(doc => 
        {
            const docData = doc.data();
            
            // Převod Firestore Timestamp na čitelný formát
            if (docData.journeyDate && docData.journeyDate.seconds) 
            {
                const date = new Date(docData.journeyDate.seconds * 1000);
                //docData.journeyDate = date.toISOString();  // Např. "2024-07-06T00:00:00.000Z"
                docData.journeyDate = date;
            }

            docData.routeLength     = ConvertUtil.convertToNumberOrNull(docData.routeLength);
            docData.metersClimbed   = ConvertUtil.convertToNumberOrNull(docData.metersClimbed);
            docData.altitudeLowest  = ConvertUtil.convertToNumberOrNull(docData.altitudeLowest);
            docData.altitudeHighest = ConvertUtil.convertToNumberOrNull(docData.altitudeHighest);
    
            return { id: doc.id, docData };
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

                // Převod ISO stringu na Firestore Timestamp
                if (typeof data.docData.journeyDate === "string") 
                {
                    data.docData.journeyDate = Timestamp.fromDate(new Date(data.docData.journeyDate));
                }

                await addDoc(collection(db, collectionName), data.docData);
            }
    
            alert("Data byla úspěšně obnovena!");
        };

        reader.readAsText(file);
    }

    #getJourneyYearCondition(year)
    {
        const startOfYear = new Date(`${year}-01-01T00:00:00Z`);
        const endOfYear = new Date(`${year}-12-31T23:59:59Z`);

        return [["journeyDate", ">=", startOfYear], ["journeyDate", "<=", endOfYear]]
    }

    #sortJourneys(sortButton)
    {
        const journeysTable = document.getElementById("journeys-table");

        const sortColumnOriginal = journeysTable.dataset.sortColumn;

        const sortColumnNew = sortButton.dataset.sortColumn;

        const sortDirectionOriginal = journeysTable.dataset.sortDirection;

        let sortDirectionNew = "desc";

        if ((sortColumnOriginal !== sortColumnNew) || (sortDirectionOriginal === "desc"))
        {
            sortDirectionNew = "asc";
        }

        journeysTable.dataset.sortDirection = sortDirectionNew;

        journeysTable.dataset.sortColumn = sortColumnNew;

        const sortIcon = sortButton.querySelector(".sort-icon");

        if (sortColumnOriginal !== sortColumnNew)
        {
            document.querySelectorAll(".sort-icon").forEach(icon => 
            {
                icon.innerHTML = "";
            });

            sortIcon.innerHTML = "▲";
        }

        sortIcon.classList.remove("asc");
        sortIcon.classList.remove("desc");

        sortIcon.classList.add(sortDirectionNew);

        this.loadJourneysTableDataAsync();
    }
}