import { describe, it, expect } from 'vitest';
import { parseSrt, serializeSrt } from './srtParser';

describe('parseSrt', () => {
  it('parses a valid SRT content', () => {
    const content = `1
00:00:01,000 --> 00:00:04,000
Hello, world!

2
00:00:05,000 --> 00:00:08,000
This is a test.`;

    const result = parseSrt(content);
    expect(result).toHaveLength(2);
    expect(result[0].startTime).toBe(1);
    expect(result[0].endTime).toBe(4);
    expect(result[0].text).toBe('Hello, world!');
    expect(result[0].index).toBe(1);
    expect(result[1].startTime).toBe(5);
    expect(result[1].endTime).toBe(8);
    expect(result[1].text).toBe('This is a test.');
  });

  it('handles multiline text', () => {
    const content = `1
00:00:01,000 --> 00:00:04,000
Line one
Line two`;

    const result = parseSrt(content);
    expect(result[0].text).toBe('Line one\nLine two');
  });

  it('handles CRLF line endings', () => {
    const content = "1\r\n00:00:01,000 --> 00:00:04,000\r\nHello";
    const result = parseSrt(content);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Hello');
  });

  it('skips invalid blocks', () => {
    const content = `invalid block

1
00:00:01,000 --> 00:00:04,000
Valid`;

    const result = parseSrt(content);
    expect(result).toHaveLength(1);
  });
});

describe('serializeSrt', () => {
  it('serializes subtitles to SRT format', () => {
    const subtitles = [
      { id: 'a', index: 1, startTime: 1, endTime: 4, text: 'Hello' },
      { id: 'b', index: 2, startTime: 5, endTime: 8, text: 'World' },
    ];

    const result = serializeSrt(subtitles);
    expect(result).toContain('1\n00:00:01,000 --> 00:00:04,000\nHello');
    expect(result).toContain('2\n00:00:05,000 --> 00:00:08,000\nWorld');
  });

  it('sorts by startTime before serializing', () => {
    const subtitles = [
      { id: 'a', index: 2, startTime: 5, endTime: 8, text: 'World' },
      { id: 'b', index: 1, startTime: 1, endTime: 4, text: 'Hello' },
    ];

    const result = serializeSrt(subtitles);
    const lines = result.split('\n');
    expect(lines[0]).toBe('1');
    expect(lines[1]).toContain('00:00:01,000');
  });

  it('round-trips parse and serialize', () => {
    const original = `1
00:00:01,500 --> 00:00:04,200
Hello, world!

2
00:00:05,000 --> 00:00:08,300
This is a test.`;

    const parsed = parseSrt(original);
    const serialized = serializeSrt(parsed);
    const reparsed = parseSrt(serialized);

    expect(reparsed).toHaveLength(2);
    expect(reparsed[0].startTime).toBeCloseTo(1.5, 3);
    expect(reparsed[0].endTime).toBeCloseTo(4.2, 3);
    expect(reparsed[0].text).toBe('Hello, world!');
    expect(reparsed[1].startTime).toBeCloseTo(5.0, 3);
    expect(reparsed[1].endTime).toBeCloseTo(8.3, 3);
  });
});
