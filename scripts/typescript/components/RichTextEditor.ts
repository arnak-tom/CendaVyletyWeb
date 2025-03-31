export class RichTextEditor 
{
    private container: HTMLElement;
    private editor: HTMLElement | null = null;
    private toolbar: HTMLElement | null = null;

    constructor(containerId: string) 
    {
        const container = document.getElementById(containerId);

        if (!container) 
        {
            throw new Error(`Element s ID '${containerId}' nebyl nalezen.`);
        }

        this.container = container;

        this.init();
    }

    private init(): void 
    {
        this.container.innerHTML = `
            <div class="rte-toolbar">
                <button data-command="bold"><b>B</b></button>
                <button data-command="italic"><i>I</i></button>
                <button data-command="createLink">🔗</button>
            </div>
            <div class="rte-editor" contenteditable="true"></div>
        `;
        
        this.editor = this.container.querySelector(".rte-editor");
        this.toolbar = this.container.querySelector(".rte-toolbar");

        if (!this.editor || !this.toolbar) 
        {
            throw new Error("Chybí některé klíčové prvky editoru.");
        }

        this.toolbar.addEventListener("click", (event: Event) => 
        {
            event.preventDefault();

            const target = event.target as HTMLElement;

            const button = target.closest("button");

            if (button)
            {
                const command = button.dataset.command;

                if (command) 
                {
                    this.handleCommand(command);
                }
            }
        });
    }

    private handleCommand(command: string): void 
    {
        if (!this.editor) return;

        const selection = document.getSelection();

        if (!selection || selection.rangeCount === 0)
        { 
            return;
        }

        const range = selection.getRangeAt(0);

        if (command === "createLink") 
        {
            const url = prompt("Zadejte URL:");

            if (url) 
            {
                const link = document.createElement("a");

                link.href = url;
                link.textContent = selection.toString();
                link.target = "_blank";

                range.deleteContents();
                range.insertNode(link);
            }
        } 
        else 
        {
            this.applyFormatting(command, selection, range);
        }
    }

    public getContent(): string 
    {
        return this.editor ? this.editor.innerHTML : "";
    }

    public setContent(content: string): void 
    {
        if (this.editor) 
        {
            this.editor.innerHTML = content;
        }
    }

    private applyFormatting(command: string, selection: Selection, range: Range): void
    {
        // Vytvoření nového prvku pro obalení textu
        let wrapperTag: keyof HTMLElementTagNameMap | null = null;

        if (command === "bold") 
        {
            wrapperTag = "b";
        } 
        else if (command === "italic") 
        {
            wrapperTag = "i";
        }
        else
        {
            return;
        }

        // Kontrola, jestli už je text uvnitř odpovídajícího tagu
        const parentElement = range.commonAncestorContainer.parentElement;

        let textNode: Text | null = null;

        if (parentElement && parentElement.tagName.toLowerCase() === wrapperTag) 
        {
            // Pokud už je text v tomto formátu, odstraníme ho
            textNode = document.createTextNode(parentElement.textContent || "");

            parentElement.replaceWith(textNode);
        }
        else 
        {
            // Pokud není, obalíme ho
            const wrapper = document.createElement(wrapperTag);

            textNode = document.createTextNode(selection.toString());

            wrapper.appendChild(textNode);
        
            range.deleteContents();
            range.insertNode(wrapper);
        }

        // Vytvoření nového výběru pro nový prvek
        const newSelection = window.getSelection();

        const newRange = document.createRange();

        newRange.selectNodeContents(textNode); // Vytvoří nový výběr pro celý wrapper

        if (newSelection)
        {
            newSelection.removeAllRanges(); // Odstraní všechny předchozí výběry
            newSelection.addRange(newRange); // Přidá nový výběr
        }
    }
}

