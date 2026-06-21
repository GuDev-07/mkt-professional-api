import { pickString, normalizeFeedbackFields } from '../dto/request/feedback-field.utils';

describe('feedback-field.utils', () => {
  describe('pickString', () => {
    it('returns first non-empty string', () => {
      expect(pickString(undefined, '', '  Teste  ', 'ignored')).toBe('Teste');
    });
  });

  describe('normalizeFeedbackFields', () => {
    it('maps jobTitle from camelCase multipart field', () => {
      const result = normalizeFeedbackFields({ jobTitle: 'CEO' });
      expect(result.jobTitle).toBe('CEO');
    });

    it('maps jobTitle from snake_case field', () => {
      const result = normalizeFeedbackFields({ job_title: 'Diretora' });
      expect(result.jobTitle).toBe('Diretora');
    });
  });
});
