const processFunction = require('./index');

describe('Process Function', () => {
    it('should echo input', async () => {
        const context = {};
        const req = { body: { input: 'hello' } };
        await processFunction(context, req);
        expect(context.res.status).toBe(200);
        expect(context.res.body.message).toBe('Echo: hello');
    });

    it('should handle missing input', async () => {
        const context = {};
        const req = { body: {} };
        await processFunction(context, req);
        expect(context.res.status).toBe(200);
        expect(context.res.body.message).toBe('No input provided.');
    });
}); 