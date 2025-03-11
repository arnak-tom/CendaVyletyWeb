import { db } from "./firebase-config.js";

import { collection, query, where, orderBy, doc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


export class Firebase
{
    /**
     * Obecná metoda pro čtení dat z Firebase
     * @param {string} collectionName - Název kolekce
     * @param {Array} whereConditions - Pole podmínek [ ["field", "operator", "value"], ... ]
     * @param {Array} orderByConditions - Pole řazení [ ["field", "direction"], ... ]
     * @returns {Promise<Array>} - Vrací pole dokumentů z kolekce
     */
    static async readDataAsync(collectionName, whereConditions = [], orderByConditions = []) 
    {
        try 
        {
            let q = collection(db, collectionName);

            // Aplikujeme where podmínky
            if (whereConditions.length > 0) 
            {
                whereConditions.forEach(condition => 
                {
                    q = query(q, where(...condition));
                });
            }

            // Aplikujeme orderBy podmínky
            if (orderByConditions.length > 0) 
            {
                orderByConditions.forEach(order => 
                {
                    q = query(q, orderBy(...order));
                });
            }

            // Získání dat
            const querySnapshot = await getDocs(q);

            const results = [];

            querySnapshot.forEach(doc => 
            {
                results.push({ docId: doc.id, ...doc.data() });
            });

            return results;
        } 
        catch (error) 
        {
            console.error("Chyba při načítání dat:", error);
            return [];
        }
    }

    /**
     * Načte jeden dokument z Firebase podle docId.
     * @param {string} collectionName - Název kolekce
     * @param {string} docId - ID dokumentu 
     */
    static async readDocumentByIdAsync(collectionName, docId) 
    {
        try 
        {
            const docRef = doc(db, collectionName, docId);

            const docSnap = await getDoc(docRef);

            if (docSnap.exists) 
            {
                console.log("Data dokumentu:", docSnap.data());

                return docSnap.data();
            } 
            else 
            {
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