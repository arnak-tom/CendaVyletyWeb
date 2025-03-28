export class ConvertUtil
{
    static formatFirestoreTimestampForDisplay(firestoreTimestamp) 
    {
        const date = new Date(firestoreTimestamp.seconds * 1000); // Převod sekund na milisekundy

        const day = String(date.getDate()).padStart(2, '0');

        const month = String(date.getMonth() + 1).padStart(2, '0'); // Měsíce jsou indexovány od 0

        const year = date.getFullYear();

        return `${day}.${month}.${year}`;
    }

    static formatFirestoreTimestampForForm(timestamp) 
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

    static convertToNumberOrNull(value) 
    {
        if (typeof value === "number") 
        {
            return value; // Pokud je to číslo, vrátí se jak je
        }

        if (typeof value === "string") 
        {
            const trimmed = value.trim();

            if (trimmed === "") 
            {
                return null; // Prázdný string → null
            }

            const num = Number(trimmed);

            return isNaN(num) ? null : num; // Pokud je to číslo, převede ho, jinak vrátí null
        }
        
        return null; // Pro všechny ostatní případy (např. undefined, objekty) vrátí null
    }
}