const customMessageOverridesEnglish = {
    1060001: "Welcome to the app! You have successfully registered. Set your first and last name to continue.",
    '1060001a': "Welcome to the app! You have successfully registered. Set your first, last name and link your account to continue.",
    1050001: "Your changes are saved!",
};

const customMessageOverridesGerman = {
    1060001: "Willkommen in der App! Sie haben sich erfolgreich registriert. Bitte geben Sie Ihren Vor- und Nachnamen ein, um fortzufahren.",
    '1060001a': "Willkommen in der App! Sie haben sich erfolgreich registriert. Bitte geben Sie Ihren Vor- und Nachnamen ein und verknüpfen Sie Ihr Konto, um fortzufahren.",
    1050001: "Ihre Änderungen wurden gespeichert!",
}

export function getValueIdentifier(selectedRole: any) {
    let value = '';
    if (selectedRole === 'engineer') {
        value = 'demo.engineer@kern.ai';
    } else if (selectedRole === 'expert') {
        value = 'demo.expert@kern.ai';
    } else if (selectedRole === 'annotator') {
        value = 'demo.annotator@kern.ai';
    }
    return value;
}

export function getValuePassword(selectedRole: any) {
    let value = '';
    if (selectedRole === 'engineer') {
        value = 'c34540903b9f';
    } else if (selectedRole === 'expert') {
        value = 'c34540903b9f';
    } else if (selectedRole === 'annotator') {
        value = 'c34540903b9f';
    }
    return value;
}

export function refactorFlowWithMoreMessages(flow: any) {
    if (flow !== undefined && flow.ui.messages == undefined) {
        const messages: any[] = [];
        flow.ui.nodes.forEach((node: any) => {
            if (node.messages.length > 0) {
                node.messages.forEach((message: any) => {
                    messages.push(message);
                });
            }
        });
        flow.ui = { ...flow?.ui, messages: messages };
    }
    return flow;
}

export function prepareNodes(flow: any) {

    let firstNameNode = flow.ui.nodes.find((node: any) => node.attributes?.name === "traits.name.first");
    if (firstNameNode) {
        firstNameNode.attributes.required = true
    }

    let lastNameNode = flow.ui.nodes.find((node: any) => node.attributes?.name === "traits.name.last");
    if (lastNameNode) {
        lastNameNode.attributes.required = true
    }

    let filteredNodes = flow.ui.nodes.filter((node: any) => !node.attributes?.name?.startsWith("metadata"));

    const providerId = flow.identity?.metadata_public?.registration_scope?.provider_id;
    if (["microsoft", "google"].includes(providerId)) {
        const mailNode = filteredNodes.find((node: any) => node.attributes?.name == "traits.email");
        mailNode.attributes.type = "hidden"
    }

    return filteredNodes;
}

export function displayMessage(msg: any, language: string): string {
    const selectDictMessages = language === "de" ? customMessageOverridesGerman : customMessageOverridesEnglish;
    return selectDictMessages[msg.id] || msg.text;
}