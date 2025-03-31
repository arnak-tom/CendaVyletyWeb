export class RichTextEditor {
    constructor(containerId) {
        this.editor = null;
        this.toolbar = null;
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Element s ID '${containerId}' nebyl nalezen.`);
        }
        this.container = container;
        this.init();
    }
    init() {
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
        if (!this.editor || !this.toolbar) {
            throw new Error("Chybí některé klíčové prvky editoru.");
        }
        this.toolbar.addEventListener("click", (event) => {
            event.preventDefault();
            const target = event.target;
            const button = target.closest("button");
            if (button) {
                const command = button.dataset.command;
                if (command) {
                    this.handleCommand(command);
                }
            }
        });
    }
    handleCommand(command) {
        if (!this.editor)
            return;
        const selection = document.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return;
        }
        const range = selection.getRangeAt(0);
        if (command === "createLink") {
            const url = prompt("Zadejte URL:");
            if (url) {
                const link = document.createElement("a");
                link.href = url;
                link.textContent = selection.toString();
                link.target = "_blank";
                range.deleteContents();
                range.insertNode(link);
            }
        }
        else {
            this.applyFormatting(command, selection, range);
        }
    }
    getContent() {
        return this.editor ? this.editor.innerHTML : "";
    }
    setContent(content) {
        if (this.editor) {
            this.editor.innerHTML = content;
        }
    }
    applyFormatting(command, selection, range) {
        // Vytvoření nového prvku pro obalení textu
        let wrapperTag = null;
        if (command === "bold") {
            wrapperTag = "b";
        }
        else if (command === "italic") {
            wrapperTag = "i";
        }
        else {
            return;
        }
        // Kontrola, jestli už je text uvnitř odpovídajícího tagu
        const parentElement = range.commonAncestorContainer.parentElement;
        let textNode = null;
        if (parentElement && parentElement.tagName.toLowerCase() === wrapperTag) {
            // Pokud už je text v tomto formátu, odstraníme ho
            textNode = document.createTextNode(parentElement.textContent || "");
            parentElement.replaceWith(textNode);
        }
        else {
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
        if (newSelection) {
            newSelection.removeAllRanges(); // Odstraní všechny předchozí výběry
            newSelection.addRange(newRange); // Přidá nový výběr
        }
    }
}
