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

export function prepareFirstLastNameAsRequired(firstNameIdx: number, lastNameIdx: number, initialFlow: any) {
    if (initialFlow.ui.nodes[firstNameIdx].attributes.name === "traits.name.first") {
        initialFlow.ui.nodes[firstNameIdx].attributes.required = true
    }
    if (initialFlow.ui.nodes[lastNameIdx].attributes.name === "traits.name.last") {
        initialFlow.ui.nodes[lastNameIdx].attributes.required = true
    }
    return initialFlow.ui.nodes;
}