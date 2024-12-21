interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

const chat: ChatMessage[] = [
    {
        role: "user",
        content: `If you’re comfortable with React’s ecosystem, a custom JSX-based approach (something like a Babel plugin or a Vite plugin that interprets JSX trees as plugin declarations) could also be viable.
You wouldn’t necessarily need the runtime aspects of React. You could treat JSX purely as a declarative syntax for plugin features. The output would again be imperative Obsidian plugin code.
One advantage of using JSX might be the popularity and familiarity of React’s ecosystem for many developers. But you’d still need a transformation step that converts the JSX elements into the plugin’s imperative registration calls.`,
    },
    {
        role: "assistant",
        content: `Yes, you are diverging from the standard DOM-based nature of Svelte or React. However, that doesn’t inherently mean it’s not useful. Using Svelte here is more about leveraging a familiar component-based, declarative syntax and its compile-time ecosystem to generate your plugin’s imperative code. If you think a JSX approach (or any other templating approach) would resonate more with the target audience—or if it provides better tooling or developer experience—then that might be a better path. Ultimately, the choice of Svelte vs. JSX vs. another approach comes down to which ecosystem and toolchain you prefer and what your users will find more intuitive, rather than a strict technical limitation.`,
    },
    {
        role: "user",
        content: `If you’re comfortable with React’s ecosystem, a custom JSX-based approach (something like a Babel plugin or a Vite plugin that interprets JSX trees as plugin declarations) could also be viable.
You wouldn’t necessarily need the runtime aspects of React. You could treat JSX purely as a declarative syntax for plugin features. The output would again be imperative Obsidian plugin code.
One advantage of using JSX might be the popularity and familiarity of React’s ecosystem for many developers. But you’d still need a transformation step that converts the JSX elements into the plugin’s imperative registration calls.`,
    },
    {
        role: "assistant",
        content: `Yes, you are diverging from the standard DOM-based nature of Svelte or React. However, that doesn’t inherently mean it’s not useful. Using Svelte here is more about leveraging a familiar component-based, declarative syntax and its compile-time ecosystem to generate your plugin’s imperative code. If you think a JSX approach (or any other templating approach) would resonate more with the target audience—or if it provides better tooling or developer experience—then that might be a better path. Ultimately, the choice of Svelte vs. JSX vs. another approach comes down to which ecosystem and toolchain you prefer and what your users will find more intuitive, rather than a strict technical limitation.`,
    },
]

// Something weird with state rune here...
// Causing an error

export class ChatModel {
    chat: ChatMessage[] = $state(chat);
    userInput: string = $state("");

    submitMessage() {
        const userMessage: ChatMessage = {
            role: "user",
            content: this.userInput,
        };
        this.chat.push(userMessage);
        this.userInput = "";
    }

    async callAiEndoint() {
        console.log("handleGenerateResponse");

        return "hi"
    }
}