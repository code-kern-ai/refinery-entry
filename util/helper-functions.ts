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