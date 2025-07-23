const customMessageOverridesEnglish = {
    1060001: "Welcome to the app! You have successfully registered. Set your first and last name to continue.",
    '1060001a': "Welcome to the app! You have successfully registered. Set your first, last name and link your account to continue.",
    '1060001b': "Welcome to the app! You have successfully recovered your account.",
    1050001: "Your changes are saved!",
    '1050001a': "Your changes are saved! Please set your password to continue.",
    '1050001ab': "Your password has been set successfully! ",
    4000032: "The password must be at least 8 characters long, but got less.",
    4000034: "The password has been found in data breaches and must no longer be used.",
    4060004: "This link is invalid, add your email below to receive a new one"
};

const customMessageOverridesGerman = {
    1060001: "Willkommen in der App! Sie haben sich erfolgreich registriert. Bitte geben Sie Ihren Vor- und Nachnamen ein, um fortzufahren.",
    '1060001a': "Willkommen in der App! Sie haben sich erfolgreich registriert. Bitte geben Sie Ihren Vor- und Nachnamen ein und verknüpfen Sie Ihr Konto, um fortzufahren.",
    '1060001b': "Willkommen in der App! Sie haben Ihr Konto erfolgreich wiederhergestellt.",
    1050001: "Ihre Änderungen wurden gespeichert!",
    '1050001a': "Ihre Änderungen wurden gespeichert! Bitte setzen Sie Ihr Passwort, um fortzufahren.",
    '1050001ab': "Ihr Passwort wurde erfolgreich gesetzt! ",
    4000032: "Das Passwort muss mindestens 8 Zeichen lang sein, aber es wurden weniger als 8 Zeichen eingegeben.",
    4000034: "Das Passwort wurde in Datenpannen gefunden und darf nicht mehr verwendet werden.",
    4060004: "Dieser Link ist ungültig, geben Sie Ihre E-Mail unten ein, um einen neuen zu erhalten"
}

const customMessageOverridesDutch = {
    1060001: "Welkom bij de app! Je bent succesvol geregistreerd. Vul je voor- en achternaam in om verder te gaan.",
    '1060001a': "Welkom bij de app! Je bent succesvol geregistreerd. Vul je voor- en achternaam in en koppel je account om verder te gaan.",
    '1060001b': "Welkom bij de app! Je hebt je account succesvol hersteld.",
    1050001: "Uw wijzigingen zijn opgeslagen!",
    '1050001a': "Uw wijzigingen zijn opgeslagen! Stel uw wachtwoord in om verder te gaan.",
    '1050001ab': "Uw wachtwoord is succesvol ingesteld! ",
    4000032: "Het wachtwoord moet minimaal 8 tekens lang zijn, maar er zijn minder dan 8 tekens ingevoerd.",
    4000034: "Het wachtwoord is gevonden in datalekken en mag niet meer worden gebruikt.",
    4060004: "Deze link is ongeldig, voeg uw e-mailadres hieronder toe om een nieuwe te ontvangen."
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
    const selectDictMessages = language === "de" ? customMessageOverridesGerman : language === "nl" ? customMessageOverridesDutch : customMessageOverridesEnglish;
    return selectDictMessages[msg.id] || msg.text;
}