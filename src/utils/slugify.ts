/**
 * 将字符串转换为 kebab-case URL slug
 * - 转换为小写
 * - 替换空格和特殊字符为连字符
 * - 去除非法字符
 * - 合并连续连字符
 * - 去除首尾连字符
 */
export function slugify(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .toLowerCase()
    .trim()
    // 替换常见特殊字符为空格
    .replace(/[&@#$%^*()_+=\[\]{};':"\\|,.<>\/?]/g, ' ')
    // 替换空格和连字符为单个连字符
    .replace(/\s+/g, '-')
    // 替换多个连续连字符为单个
    .replace(/-+/g, '-')
    // 去除非字母数字和连字符的字符
    .replace(/[^a-z0-9-]/g, '')
    // 去除首尾连字符
    .replace(/^-+|-+$/g, '');
}

/**
 * 生成带 slug 的路径
 */
export function generateSlugPath(basePath: string, title: string): string {
  const slug = slugify(title);
  return `${basePath}/${slug}`;
}

export default slugify;
