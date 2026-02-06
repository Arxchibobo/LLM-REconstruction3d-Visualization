import { NextRequest, NextResponse } from 'next/server';
import { projectStructureService } from '@/services/project-structure/ProjectStructureService';
import path from 'path';

/**
 * GET /api/project-structure
 *
 * 扫描项目结构并返回文件和依赖关系
 *
 * Query 参数:
 * - projectPath: 项目路径 (可选,默认为当前项目的 src/)
 */
export async function GET(request: NextRequest) {
  try {

    // 获取项目路径参数
    const { searchParams } = new URL(request.url);
    const projectPath = searchParams.get('projectPath');

    // 默认扫描当前项目的 src/ 目录
    const defaultPath = path.join(process.cwd(), 'src');
    const targetPath = projectPath || defaultPath;


    // 扫描项目
    await projectStructureService.scanProject(targetPath);

    // 获取结果
    const files = projectStructureService.getFiles();
    const dependencies = projectStructureService.getDependencies();


    // 按类型统计
    const filesByType = projectStructureService.getFilesByType();
    for (const [type, typeFiles] of filesByType) {
    }

    return NextResponse.json({
      success: true,
      data: {
        files,
        dependencies,
        statistics: {
          totalFiles: files.length,
          totalDependencies: dependencies.length,
          filesByType: Array.from(filesByType.entries()).map(([type, typeFiles]) => ({
            type,
            count: typeFiles.length
          })),
          topImportantFiles: projectStructureService
            .getFilesSortedByImportance()
            .slice(0, 10)
            .map(f => ({
              name: f.name,
              type: f.type,
              importance: f.importance,
              exportedBy: f.exportedBy.length
            }))
        }
      }
    });

  } catch (error: any) {

    return NextResponse.json({
      success: false,
      error: error.message || '扫描项目结构失败'
    }, { status: 500 });
  }
}
