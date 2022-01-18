export const checkHttpStatus = res => {
	if ([200, 201, 204].includes(res.status)) {
		return res;
	}

	throw Error(`${res.status} ${res.statusText}`);
};

export const httpCheckParse = res => checkHttpStatus(res).json();

export const checkNotNull = val => {
	if (val === null || val === undefined) {
		throw new Error('Value is null');
	}

	return val;
};

export const checkNotEmpty = val => {
	if (String(checkNotNull(val)).trim() === '') {
		throw new Error('Value is an empty string');
	}

	return val;
};

export const checkIsNumberOrString = val => {
	if (['number', 'string'].includes(typeof val)) {
		return val;
	}

	throw new Error('Value is not a number or a string');
}

export const clone = obj => JSON.parse(JSON.stringify(checkNotNull(obj)));

export const tryParseInt = x => {
	try {
		const val = parseInt(x);
		if (!isNaN(val) && isFinite(val)) {
			return val;
		}

		return x;
	} catch {
		return x;
	}
}