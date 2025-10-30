'use client';

import React from 'react';
import Link from 'next/link';

// Basic URL regex (no protocol optional) and image extensions
const URL_REGEX = /\b(https?:\/\/[^\s]+|www\.[^\s]+)\b/gi;
const IMAGE_EXT_REGEX = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i;
const MENTION_REGEX = /(^|\s)@([a-zA-Z0-9_]{2,32})\b/g; // @handle
const GAME_PATH_REGEX = /\b(?:https?:\/\/[^\s]+)?\/game\/([a-zA-Z0-9\-]{6,})\b/gi;

export interface ParsedContent {
  nodes: React.ReactNode;
  embeds: React.ReactNode[];
}

function normalizeUrl(url: string): string {
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
}

function isImageUrl(url: string): boolean {
  try {
    const u = normalizeUrl(url);
    return IMAGE_EXT_REGEX.test(new URL(u).pathname);
  } catch {
    return false;
  }
}

export function renderMessageContent(raw: string): ParsedContent {
  const embeds: React.ReactNode[] = [];

  // First, replace game links with Links and collect embeds
  let text = raw;
  const gameEmbeds: Array<{ id: string; href: string }> = [];
  text = text.replace(GAME_PATH_REGEX, (match, gameId) => {
    const href = `/game/${gameId}`;
    gameEmbeds.push({ id: gameId, href });
    return href; // keep link text normalized
  });

  // Split by URLs to interleave anchors/mentions
  const parts = text.split(URL_REGEX);

  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i] ?? '';
    if (URL_REGEX.test(part)) {
      // It's a URL match (because split keeps delimiters in capture groups)
      const url = normalizeUrl(part);
      const isImage = isImageUrl(part);
      nodes.push(
        <a key={`url-${i}`} href={url} target="_blank" rel="nofollow noopener noreferrer" className="text-orange-300 underline break-all">
          {part}
        </a>
      );
      if (isImage && embeds.length < 3) {
        embeds.push(
          <div key={`img-${i}`} className="mt-2">
            <a href={url} target="_blank" rel="nofollow noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="shared image" className="max-h-64 rounded border border-[#3e3a33] light:border-[#d4caba]" />
            </a>
          </div>
        );
      }
    } else {
      // Plain text: convert @mentions to Links
      const chunks: React.ReactNode[] = [];
      let lastIndex = 0;
      part.replace(MENTION_REGEX, (m, prefix, handle, offset) => {
        const before = part.slice(lastIndex, offset);
        if (before) chunks.push(<span key={`t-${i}-${lastIndex}`}>{before}</span>);
        chunks.push(
          <>
            {prefix}
            <Link key={`m-${i}-${offset}`} href={`/profile/${handle}`} className="text-orange-300 underline">
              @{handle}
            </Link>
          </>
        );
        lastIndex = offset + m.length;
        return m;
      });
      const tail = part.slice(lastIndex);
      if (tail) chunks.push(<span key={`t-${i}-tail`}>{tail}</span>);
      nodes.push(<React.Fragment key={`txt-${i}`}>{chunks}</React.Fragment>);
    }
  }

  // Add simple game embeds (limit 1 per message to keep UI tidy)
  if (gameEmbeds.length > 0) {
    const { id, href } = gameEmbeds[0];
    embeds.push(
      <div key={`game-${id}`} className="mt-2 p-2 rounded border border-[#3e3a33] light:border-[#d4caba] bg-[#2a2723]/50 light:bg-[#faf7f2]">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-[#a0958a] light:text-[#5a5449]">Shared game</div>
          <div className="text-xs font-mono text-white light:text-black">#{id.slice(0, 8)}</div>
        </div>
        <div className="mt-2 flex gap-2">
          <Link href={href} className="px-2 py-1 text-xs bg-orange-400 text-white rounded hover:bg-orange-500">View</Link>
          <Link href={`${href}/analysis`} className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700">Analyze</Link>
        </div>
      </div>
    );
  }

  return { nodes: <>{nodes}</>, embeds };
}


