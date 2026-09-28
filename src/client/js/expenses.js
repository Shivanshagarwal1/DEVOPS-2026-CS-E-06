initPage('expenses', (user, view) => buildTxnView(user, view, { endpoint: '/expenses', fixedType: 'expense' }));
