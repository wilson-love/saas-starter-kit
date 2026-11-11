/**
 * 通用「分享图 / 卡片」渲染：satori(JSX -> SVG) -> @resvg/resvg-js(SVG -> PNG)。
 * 纯确定性、无网络；字体从 assets/fonts 读取（仓库已带 Inter woff，OFL 协议）。
 * 必须 Node runtime（resvg 原生模块不能跑 edge）。
 *
 * 用法：把你的卡片写成 JSX（只认 flexbox 布局，见 docs/DEVELOPER_HANDOFF.md），
 * 然后 renderElementPng(<MyCard {...} />, 1080, 1350) 得到 PNG Buffer。
 */
import satori, { type SatoriOptions } from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import type { ReactElement } from 'react';

const FONT_DIR = path.join(process.cwd(), 'assets', 'fonts');

function loadFonts(): SatoriOptions['fonts'] {
  const fonts: SatoriOptions['fonts'] = [];
  const reg = path.join(FONT_DIR, 'Inter-Regular.woff');
  const bold = path.join(FONT_DIR, 'Inter-Bold.woff');
  if (fs.existsSync(reg)) {
    fonts.push({ name: 'Inter', data: fs.readFileSync(reg), weight: 400, style: 'normal' });
  }
  if (fs.existsSync(bold)) {
    fonts.push({ name: 'Inter', data: fs.readFileSync(bold), weight: 700, style: 'normal' });
  }
  return fonts;
}

export async function renderElementSvg(node: ReactElement, width: number, height: number): Promise<string> {
  const fonts = loadFonts();
  return satori(node, { width, height, fonts });
}

export async function renderElementPng(node: ReactElement, width: number, height: number): Promise<Buffer> {
  const svg = await renderElementSvg(node, width, height);
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } });
  return resvg.render().asPng();
}
