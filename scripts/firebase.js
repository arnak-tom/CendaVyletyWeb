import { db } from "./firebase-config.js";

import { getFirestore, collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


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
}