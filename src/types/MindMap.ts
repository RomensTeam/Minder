export interface MindMapNode {
  id: string;
  content: string;
  children: MindMapNode[];
  parentId: string | null;
  position?: {
    x: number;
    y: number;
  };
}

export interface MindMap {
  id: string;
  name: string;
  rootNode: MindMapNode;
  createdAt: Date;
  updatedAt: Date;
}