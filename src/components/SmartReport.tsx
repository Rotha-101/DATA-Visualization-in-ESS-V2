import React, { useState, useEffect, useRef } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Image, Table, AlertCircle, Code, Link as LinkIcon, Link2Off,
  Undo2, Redo2, FileText, FileDown, Trash2, Printer, ArrowRightToLine, FileSpreadsheet,
  Check, Copy, Sparkles, HelpCircle, RefreshCw, X, Plus, Upload,
  Battery, Activity, GitCompare, Thermometer, Zap, AlertTriangle, PenTool, Coins, Cpu, BarChart3, Settings,
  ChevronDown, ChevronRight, Folder
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_LIBRARY_TOOLS, CustomTool } from '../lib/defaultTools';

interface SmartReportProps {
  lastAiResponse?: string;
  project?: string;
  plant?: string;
  theme?: 'light' | 'dark';
}

export function SmartReport({ lastAiResponse = '', project = 'SNTL 400', plant = 'plant1', theme = 'dark' }: SmartReportProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Undo/Redo history states
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isHistoryAction, setIsHistoryAction] = useState(false);
  
  // UI popups and states
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  
  const [showCalloutModal, setShowCalloutModal] = useState(false);
  const [calloutType, setCalloutType] = useState<'info' | 'warning' | 'error'>('info');

  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Statistics
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Editor states
  const [activeFont, setActiveFont] = useState('Inter');
  const [activeSize, setActiveSize] = useState('14px');
  const [selectedPlant, setSelectedPlant] = useState(plant);

  // Custom tool states


  // Ribbon layout interfaces
  interface RibbonCommand {
    id: string;
    label: string;
    iconName: string;
  }

  interface RibbonGroup {
    id: string;
    label: string;
    visible: boolean;
    commands: RibbonCommand[];
  }

  interface RibbonTab {
    id: string;
    label: string;
    visible: boolean;
    groups: RibbonGroup[];
  }

  const defaultSignatureTool: CustomTool = {
    id: "signature_sign_off_default",
    name: "Engineering Sign-off (Default)",
    shortName: "Sign-off",
    description: "Default signature box for operational and grid engineering reports.",
    category: "addins",
    group: "custom_tools",
    iconName: "PenTool",
    fields: [
      { id: "engineerName", label: "Engineer Name", type: "text", defaultValue: "Alex Mercer" },
      { id: "role", label: "Role/Title", type: "text", defaultValue: "Lead Battery Storage Engineer" },
      { id: "company", label: "Company", type: "text", defaultValue: "SNT Energy Solutions" }
    ],
    execute: (inputs) => {
      const name = inputs.engineerName || "Alex Mercer";
      const role = inputs.role || "Lead Battery Storage Engineer";
      const company = inputs.company || "SNT Energy Solutions";
      const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      return `
        <div class="engineering-signoff-box">
          <div style="font-weight: bold; font-size: 13px; color: #00A3FF; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">🖋️ Engineering Verification & Approval</div>
          <table class="signoff-table">
            <tr>
              <td style="padding: 6px 0; width: 35%;" class="signoff-label">Verified By:</td>
              <td style="padding: 6px 0; font-weight: bold;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0;" class="signoff-label">Role / Designation:</td>
              <td style="padding: 6px 0;">${role}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0;" class="signoff-label">Organization:</td>
              <td style="padding: 6px 0;">${company}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0;" class="signoff-label">Verification Date:</td>
              <td style="padding: 6px 0; font-family: monospace;">${dateStr}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0 0 0;" class="signoff-label">Signature:</td>
              <td style="padding: 12px 0 0 0; font-family: 'Courier New', Courier, monospace; font-size: 16px; font-style: italic; color: #00A3FF; font-weight: bold;">
                /s/ ${name}
              </td>
            </tr>
          </table>
        </div>
      `;
    }
  };

  const [customTools, setCustomTools] = useState<CustomTool[]>([
    defaultSignatureTool,
    ...DEFAULT_LIBRARY_TOOLS
  ]);

  const [selectedTool, setSelectedTool] = useState<CustomTool | null>(null);
  const [showToolModal, setShowToolModal] = useState(false);
  const [toolInputs, setToolInputs] = useState<Record<string, any>>({});
  const toolFileInputRef = useRef<HTMLInputElement>(null);

  // States for category-routing tool uploader dialog
  const [pendingImportTool, setPendingImportTool] = useState<{ tool: CustomTool; content: string } | null>(null);
  const [showImportTargetModal, setShowImportTargetModal] = useState(false);
  const [importTargetTabId, setImportTargetTabId] = useState<string>('addins');
  const [importTargetGroupId, setImportTargetGroupId] = useState<string>('custom_tools');
  const [newTabName, setNewTabName] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState<string>('');

  // Ribbon Toolbar States
  const [ribbonLayout, setRibbonLayout] = useState<RibbonTab[]>([]);
  const [activeRibbonTab, setActiveRibbonTab] = useState<string>("home");

  // Ribbon Customizer Modal States
  const [showCustomizeRibbonModal, setShowCustomizeRibbonModal] = useState(false);
  const [tempRibbonLayout, setTempRibbonLayout] = useState<RibbonTab[]>([]);
  const [selectedAvailableCommandId, setSelectedAvailableCommandId] = useState<string>("");
  const [selectedTreeNode, setSelectedTreeNode] = useState<{
    type: 'tab' | 'group' | 'command';
    tabId: string;
    groupId?: string;
    commandId?: string;
  } | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'tab_home': true,
    'tab_insert': true,
    'tab_addins': true
  });
  const [chooseCommandsFrom, setChooseCommandsFrom] = useState<string>("popular");
  const [showResetDropdown, setShowResetDropdown] = useState(false);
  const [showImportExportDropdown, setShowImportExportDropdown] = useState(false);
  const ribbonConfigFileInputRef = useRef<HTMLInputElement>(null);

  const defaultRibbonLayout: RibbonTab[] = [
    {
      id: "home",
      label: "Home",
      visible: true,
      groups: [
        {
          id: "font",
          label: "Font",
          visible: true,
          commands: [
            { id: "font_family", label: "Font Family", iconName: "Font" },
            { id: "font_size", label: "Font Size", iconName: "TextSize" },
            { id: "bold", label: "Bold", iconName: "Bold" },
            { id: "italic", label: "Italic", iconName: "Italic" },
            { id: "underline", label: "Underline", iconName: "Underline" },
            { id: "strikethrough", label: "Strikethrough", iconName: "Strikethrough" },
            { id: "colors", label: "Text & Highlight Colors", iconName: "Palette" }
          ]
        },
        {
          id: "paragraph",
          label: "Paragraph",
          visible: true,
          commands: [
            { id: "align_left", label: "Align Left", iconName: "AlignLeft" },
            { id: "align_center", label: "Align Center", iconName: "AlignCenter" },
            { id: "align_right", label: "Align Right", iconName: "AlignRight" },
            { id: "align_justify", label: "Align Justify", iconName: "AlignJustify" },
            { id: "list_bullet", label: "Bullet List", iconName: "List" },
            { id: "list_ordered", label: "Numbered List", iconName: "ListOrdered" },
            { id: "hr", label: "Horizontal Line", iconName: "ArrowRightToLine" },
            { id: "page_break", label: "Page Break", iconName: "PB" }
          ]
        }
      ]
    },
    {
      id: "insert",
      label: "Insert",
      visible: true,
      groups: [
        {
          id: "tables",
          label: "Tables",
          visible: true,
          commands: [
            { id: "table", label: "Table", iconName: "Table" }
          ]
        },
        {
          id: "illustrations",
          label: "Illustrations",
          visible: true,
          commands: [
            { id: "image", label: "Upload Image", iconName: "Image" }
          ]
        },
        {
          id: "links",
          label: "Links",
          visible: true,
          commands: [
            { id: "hyperlink", label: "Hyperlink", iconName: "LinkIcon" },
            { id: "unlink", label: "Remove Link", iconName: "Link2Off" }
          ]
        },
        {
          id: "analytics",
          label: "Grid Analytics",
          visible: true,
          commands: [
            { id: "callout", label: "Callout Box", iconName: "AlertCircle" },
            { id: "code_block", label: "Code Block", iconName: "Code" },
            { id: "ai_response", label: "AI Response", iconName: "Sparkles" },
            { id: "bess_graph", label: "BESS Graph", iconName: "FileSpreadsheet" }
          ]
        }
      ]
    },
    {
      id: "bess_ops",
      label: "BESS Metrics",
      visible: true,
      groups: [
        {
          id: "capacity_aging",
          label: "Capacity & Aging",
          visible: true,
          commands: DEFAULT_LIBRARY_TOOLS.filter(t => t.category === 'bess_ops' && t.group === 'capacity_aging').map(t => ({
            id: `tool_${t.id}`,
            label: t.name,
            iconName: t.iconName
          }))
        },
        {
          id: "energy_efficiency",
          label: "Energy & Efficiency",
          visible: true,
          commands: DEFAULT_LIBRARY_TOOLS.filter(t => t.category === 'bess_ops' && t.group === 'energy_efficiency').map(t => ({
            id: `tool_${t.id}`,
            label: t.name,
            iconName: t.iconName
          }))
        },
        {
          id: "inverter_hvac",
          label: "Inverter & HVAC",
          visible: true,
          commands: DEFAULT_LIBRARY_TOOLS.filter(t => t.category === 'bess_ops' && t.group === 'inverter_hvac').map(t => ({
            id: `tool_${t.id}`,
            label: t.name,
            iconName: t.iconName
          }))
        }
      ]
    },
    {
      id: "grid_eng",
      label: "Grid Engineering",
      visible: true,
      groups: [
        {
          id: "freq_response",
          label: "Frequency Response",
          visible: true,
          commands: DEFAULT_LIBRARY_TOOLS.filter(t => t.category === 'grid_eng' && t.group === 'freq_response').map(t => ({
            id: `tool_${t.id}`,
            label: t.name,
            iconName: t.iconName
          }))
        },
        {
          id: "power_dispatch",
          label: "Power Dispatch",
          visible: true,
          commands: DEFAULT_LIBRARY_TOOLS.filter(t => t.category === 'grid_eng' && t.group === 'power_dispatch').map(t => ({
            id: `tool_${t.id}`,
            label: t.name,
            iconName: t.iconName
          }))
        }
      ]
    },
    {
      id: "safety_diag",
      label: "Safety & Protection",
      visible: true,
      groups: [
        {
          id: "thermal_safety",
          label: "Thermal Safety",
          visible: true,
          commands: DEFAULT_LIBRARY_TOOLS.filter(t => t.category === 'safety_diag' && t.group === 'thermal_safety').map(t => ({
            id: `tool_${t.id}`,
            label: t.name,
            iconName: t.iconName
          }))
        },
        {
          id: "protection_systems",
          label: "Protection Systems",
          visible: true,
          commands: DEFAULT_LIBRARY_TOOLS.filter(t => t.category === 'safety_diag' && t.group === 'protection_systems').map(t => ({
            id: `tool_${t.id}`,
            label: t.name,
            iconName: t.iconName
          }))
        },
        {
          id: "alarms_checklists",
          label: "Alarms & Checklists",
          visible: true,
          commands: DEFAULT_LIBRARY_TOOLS.filter(t => t.category === 'safety_diag' && t.group === 'alarms_checklists').map(t => ({
            id: `tool_${t.id}`,
            label: t.name,
            iconName: t.iconName
          }))
        }
      ]
    },
    {
      id: "financial_opt",
      label: "Financials",
      visible: true,
      groups: [
        {
          id: "revenue_arbitrage",
          label: "Revenue & Arbitrage",
          visible: true,
          commands: DEFAULT_LIBRARY_TOOLS.filter(t => t.category === 'financial_opt' && t.group === 'revenue_arbitrage').map(t => ({
            id: `tool_${t.id}`,
            label: t.name,
            iconName: t.iconName
          }))
        },
        {
          id: "operating_costs",
          label: "Operating Costs",
          visible: true,
          commands: DEFAULT_LIBRARY_TOOLS.filter(t => t.category === 'financial_opt' && t.group === 'operating_costs').map(t => ({
            id: `tool_${t.id}`,
            label: t.name,
            iconName: t.iconName
          }))
        },
        {
          id: "scheduling_opt",
          label: "Scheduling Optimization",
          visible: true,
          commands: DEFAULT_LIBRARY_TOOLS.filter(t => t.category === 'financial_opt' && t.group === 'scheduling_opt').map(t => ({
            id: `tool_${t.id}`,
            label: t.name,
            iconName: t.iconName
          }))
        }
      ]
    },
    {
      id: "addins",
      label: "Add-ins",
      visible: true,
      groups: [
        {
          id: "custom_tools",
          label: "Custom Add-ins",
          visible: true,
          commands: [
            { id: "import_tool", label: "Import Tool File", iconName: "Upload" },
            { id: "tool_signature_sign_off_default", label: "Engineering Sign-off (Default)", iconName: "signature_sign_off_default" }
          ]
        }
      ]
    }
  ];

  const MASTER_AVAILABLE_COMMANDS = [
    { id: "font_family", label: "Font Family", iconName: "Font" },
    { id: "font_size", label: "Font Size", iconName: "TextSize" },
    { id: "bold", label: "Bold", iconName: "Bold" },
    { id: "italic", label: "Italic", iconName: "Italic" },
    { id: "underline", label: "Underline", iconName: "Underline" },
    { id: "strikethrough", label: "Strikethrough", iconName: "Strikethrough" },
    { id: "colors", label: "Text & Highlight Colors", iconName: "Palette" },
    { id: "align_left", label: "Align Left", iconName: "AlignLeft" },
    { id: "align_center", label: "Align Center", iconName: "AlignCenter" },
    { id: "align_right", label: "Align Right", iconName: "AlignRight" },
    { id: "align_justify", label: "Align Justify", iconName: "AlignJustify" },
    { id: "list_bullet", label: "Bullet List", iconName: "List" },
    { id: "list_ordered", label: "Numbered List", iconName: "ListOrdered" },
    { id: "hr", label: "Horizontal Line", iconName: "ArrowRightToLine" },
    { id: "page_break", label: "Page Break", iconName: "PB" },
    { id: "table", label: "Table", iconName: "Table" },
    { id: "image", label: "Upload Image", iconName: "Image" },
    { id: "hyperlink", label: "Hyperlink", iconName: "LinkIcon" },
    { id: "unlink", label: "Remove Link", iconName: "Link2Off" },
    { id: "callout", label: "Callout Box", iconName: "AlertCircle" },
    { id: "code_block", label: "Code Block", iconName: "Code" },
    { id: "ai_response", label: "AI Response", iconName: "Sparkles" },
    { id: "bess_graph", label: "BESS Graph", iconName: "FileSpreadsheet" },
    { id: "import_tool", label: "Import Tool File", iconName: "Upload" }
  ];

  const getAvailableCommands = () => {
    const customCmds = customTools.map(t => ({
      id: `tool_${t.id}`,
      label: t.name,
      iconName: t.id
    }));
    return [...MASTER_AVAILABLE_COMMANDS, ...customCmds];
  };

  // Load custom tools and ribbon layout on mount
  useEffect(() => {
    // 1. Load saved tools
    const savedTools = localStorage.getItem('ess_imported_tools_code');
    if (savedTools) {
      try {
        const codes = JSON.parse(savedTools) as string[];
        const parsedTools: CustomTool[] = [];
        codes.forEach(code => {
          try {
            let tool: any;
            try {
              tool = new Function(`return ${code}`)();
            } catch (e1) {
              tool = eval(code);
            }
            if (tool && tool.id && tool.name && tool.execute) {
              parsedTools.push(tool);
            }
          } catch (err) {
            console.error("Error loading persisted tool", err);
          }
        });
        
        if (parsedTools.length > 0) {
          setCustomTools(prev => {
            const baseTools = prev.filter(t => t.id === 'signature_sign_off_default' || DEFAULT_LIBRARY_TOOLS.some(lt => lt.id === t.id));
            const baseIds = new Set(baseTools.map(b => b.id));
            const userImported = parsedTools.filter(t => !baseIds.has(t.id));
            return [...baseTools, ...userImported];
          });
        }
      } catch (e) {
        console.error("Failed to parse saved tools", e);
      }
    }

    // 2. Load ribbon layout
    const savedLayout = localStorage.getItem('ess_smart_report_ribbon_v1');
    if (savedLayout) {
      try {
        const layout = JSON.parse(savedLayout) as RibbonTab[];
        const hasBessOps = layout.some(tab => tab.id === 'bess_ops');
        if (hasBessOps) {
          setRibbonLayout(layout);
        } else {
          setRibbonLayout(defaultRibbonLayout);
          localStorage.setItem('ess_smart_report_ribbon_v1', JSON.stringify(defaultRibbonLayout));
        }
      } catch (e) {
        setRibbonLayout(defaultRibbonLayout);
      }
    } else {
      setRibbonLayout(defaultRibbonLayout);
    }
  }, []);

  const handleToolImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let tool: any;
        try {
          tool = new Function(`return ${content}`)();
        } catch (e1) {
          tool = eval(content);
        }

        if (!tool || !tool.id || !tool.name || !tool.execute) {
          throw new Error("Missing required fields (id, name, or execute function)");
        }

        // Set pending tool and open destination selection modal
        setPendingImportTool({ tool, content });
        setImportTargetTabId('addins');
        setImportTargetGroupId('custom_tools');
        setNewTabName('');
        setNewGroupName('');
        setShowImportTargetModal(true);
      } catch (err: any) {
        alert(`Failed to parse tool file "${file.name}": ${err.message || err}`);
      }
    };
    reader.onerror = () => {
      alert(`Error reading file "${file.name}"`);
    };
    reader.readAsText(file);

    if (toolFileInputRef.current) {
      toolFileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (!pendingImportTool) return;
    const { tool, content } = pendingImportTool;

    let targetTabId = importTargetTabId;
    let targetGroupId = importTargetGroupId;

    setRibbonLayout(prevLayout => {
      let updatedLayout = [...prevLayout];

      // 1. Check if we need to create a new tab
      if (targetTabId === 'create_new_tab') {
        const generatedTabId = `tab_${Date.now()}`;
        const generatedGroupId = `group_${Date.now()}`;
        const tabLabel = newTabName.trim() || "Custom Tab";
        const groupLabel = newGroupName.trim() || "Custom Group";

        const newTab: RibbonTab = {
          id: generatedTabId,
          label: tabLabel,
          visible: true,
          groups: [
            {
              id: generatedGroupId,
              label: groupLabel,
              visible: true,
              commands: [{ id: `tool_${tool.id}`, label: tool.name, iconName: tool.iconName || tool.id }]
            }
          ]
        };
        updatedLayout.push(newTab);
      } else {
        // Find existing tab
        updatedLayout = updatedLayout.map(tab => {
          if (tab.id === targetTabId) {
            let updatedGroups = [...tab.groups];

            // 2. Check if we need to create a new group in this tab
            if (targetGroupId === 'create_new_group') {
              const generatedGroupId = `group_${Date.now()}`;
              const groupLabel = newGroupName.trim() || "Custom Group";
              
              updatedGroups.push({
                id: generatedGroupId,
                label: groupLabel,
                visible: true,
                commands: [{ id: `tool_${tool.id}`, label: tool.name, iconName: tool.iconName || tool.id }]
              });
            } else {
              // Add to existing group
              updatedGroups = updatedGroups.map(group => {
                if (group.id === targetGroupId) {
                  const exists = group.commands.some(c => c.id === `tool_${tool.id}`);
                  if (!exists) {
                    return {
                      ...group,
                      commands: [...group.commands, { id: `tool_${tool.id}`, label: tool.name, iconName: tool.iconName || tool.id }]
                    };
                  }
                }
                return group;
              });
            }

            return { ...tab, groups: updatedGroups };
          }
          return tab;
        });
      }

      localStorage.setItem('ess_smart_report_ribbon_v1', JSON.stringify(updatedLayout));
      return updatedLayout;
    });

    // 3. Update customTools list
    setCustomTools(prev => {
      const filtered = prev.filter(t => t.id !== tool.id);
      return [...filtered, tool];
    });

    // 4. Persist tool code in registry
    const toolRegistry: Record<string, string> = JSON.parse(localStorage.getItem('ess_imported_tools_registry') || '{}');
    toolRegistry[tool.id] = content;
    localStorage.setItem('ess_imported_tools_registry', JSON.stringify(toolRegistry));
    localStorage.setItem('ess_imported_tools_code', JSON.stringify(Object.values(toolRegistry)));

    // Reset and close
    setPendingImportTool(null);
    setShowImportTargetModal(false);
  };

  const handleSelectTool = (toolId: string) => {
    if (!toolId) return;
    const tool = customTools.find(t => t.id === toolId);
    if (!tool) return;
    
    const initialInputs: Record<string, any> = {};
    tool.fields.forEach(field => {
      initialInputs[field.id] = field.defaultValue !== undefined ? field.defaultValue : '';
    });
    
    setToolInputs(initialInputs);
    setSelectedTool(tool);
    setShowToolModal(true);
  };

  const handleExecuteTool = () => {
    if (!selectedTool) return;
    try {
      const html = selectedTool.execute(toolInputs);
      insertHtmlAtCursor(html);
      setShowToolModal(false);
      setSelectedTool(null);
    } catch (err: any) {
      alert(`Error executing tool: ${err.message || err}`);
    }
  };

  const handleRibbonCommand = (cmdId: string) => {
    // 1. Text commands
    if (cmdId === 'bold') executeCommand('bold');
    else if (cmdId === 'italic') executeCommand('italic');
    else if (cmdId === 'underline') executeCommand('underline');
    else if (cmdId === 'strikethrough') executeCommand('strikeThrough');
    else if (cmdId === 'align_left') executeCommand('justifyLeft');
    else if (cmdId === 'align_center') executeCommand('justifyCenter');
    else if (cmdId === 'align_right') executeCommand('justifyRight');
    else if (cmdId === 'align_justify') executeCommand('justifyFull');
    else if (cmdId === 'list_bullet') executeCommand('insertUnorderedList');
    else if (cmdId === 'list_ordered') executeCommand('insertOrderedList');
    else if (cmdId === 'hr') executeCommand('insertHorizontalRule');
    else if (cmdId === 'page_break') {
      insertHtmlAtCursor('<hr class="page-break" title="Page Break" />');
    }
    
    // 2. Elements/Modals
    else if (cmdId === 'table') setShowTableModal(true);
    else if (cmdId === 'image') fileInputRef.current?.click();
    else if (cmdId === 'hyperlink') setShowLinkModal(true);
    else if (cmdId === 'unlink') executeCommand('unlink');
    else if (cmdId === 'callout') setShowCalloutModal(true);
    else if (cmdId === 'code_block') {
      insertHtmlAtCursor('<pre class="report-code-block"><code>// code parameters here...</code></pre>');
    }
    else if (cmdId === 'ai_response') handleImportAiResponse();
    else if (cmdId === 'bess_graph') handleImportActiveGraph();
    else if (cmdId === 'import_tool') toolFileInputRef.current?.click();
    
    // 3. Custom tools execution
    else if (cmdId.startsWith('tool_')) {
      const toolId = cmdId.substring(5);
      handleSelectTool(toolId);
    }
  };

  // Ribbon Customizer Actions
  const handleOpenRibbonCustomizer = () => {
    setTempRibbonLayout(JSON.parse(JSON.stringify(ribbonLayout)));
    setSelectedAvailableCommandId("");
    setSelectedTreeNode(null);
    setShowCustomizeRibbonModal(true);
  };

  const handleSaveRibbonCustomizer = () => {
    setRibbonLayout(tempRibbonLayout);
    localStorage.setItem('ess_smart_report_ribbon_v1', JSON.stringify(tempRibbonLayout));
    setShowCustomizeRibbonModal(false);
  };

  const handleAddCommand = () => {
    if (!selectedAvailableCommandId || !selectedTreeNode || selectedTreeNode.type !== 'group') return;
    
    const cmdList = getAvailableCommands();
    const cmdToCopy = cmdList.find(c => c.id === selectedAvailableCommandId);
    if (!cmdToCopy) return;

    const newLayout = tempRibbonLayout.map(tab => {
      if (tab.id === selectedTreeNode.tabId) {
        const newGroups = tab.groups.map(group => {
          if (group.id === selectedTreeNode.groupId) {
            // Avoid duplicates in the same group
            const exists = group.commands.some(c => c.id === cmdToCopy.id);
            if (!exists) {
              return {
                ...group,
                commands: [...group.commands, { id: cmdToCopy.id, label: cmdToCopy.label, iconName: cmdToCopy.iconName }]
              };
            }
          }
          return group;
        });
        return { ...tab, groups: newGroups };
      }
      return tab;
    });
    setTempRibbonLayout(newLayout);
  };

  const handleRemoveNode = () => {
    if (!selectedTreeNode) return;
    
    const { type, tabId, groupId, commandId } = selectedTreeNode;
    
    if (type === 'command') {
      const newLayout = tempRibbonLayout.map(tab => {
        if (tab.id === tabId) {
          const newGroups = tab.groups.map(group => {
            if (group.id === groupId) {
              return {
                ...group,
                commands: group.commands.filter(c => c.id !== commandId)
              };
            }
            return group;
          });
          return { ...tab, groups: newGroups };
        }
        return tab;
      });
      setTempRibbonLayout(newLayout);
      setSelectedTreeNode(null);
    } else if (type === 'group') {
      const newLayout = tempRibbonLayout.map(tab => {
        if (tab.id === tabId) {
          return {
            ...tab,
            groups: tab.groups.filter(g => g.id !== groupId)
          };
        }
        return tab;
      });
      setTempRibbonLayout(newLayout);
      setSelectedTreeNode(null);
    } else if (type === 'tab') {
      const newLayout = tempRibbonLayout.filter(t => t.id !== tabId);
      setTempRibbonLayout(newLayout);
      setSelectedTreeNode(null);
    }
  };

  const handleCreateNewTab = () => {
    const tabId = `tab_${Date.now()}`;
    const groupId = `group_${Date.now()}`;
    const newTab: RibbonTab = {
      id: tabId,
      label: "New Tab (Custom)",
      visible: true,
      groups: [
        {
          id: groupId,
          label: "New Group",
          visible: true,
          commands: []
        }
      ]
    };
    setTempRibbonLayout(prev => [...prev, newTab]);
    setSelectedTreeNode({ type: 'tab', tabId });
  };

  const handleCreateNewGroup = () => {
    if (!selectedTreeNode) return;
    const tabId = selectedTreeNode.tabId;
    const groupId = `group_${Date.now()}`;
    
    const newLayout = tempRibbonLayout.map(tab => {
      if (tab.id === tabId) {
        return {
          ...tab,
          groups: [...tab.groups, { id: groupId, label: "New Group (Custom)", visible: true, commands: [] }]
        };
      }
      return tab;
    });
    setTempRibbonLayout(newLayout);
    setSelectedTreeNode({ type: 'group', tabId, groupId });
  };

  const handleRenameNode = () => {
    if (!selectedTreeNode || selectedTreeNode.type === 'command') return;
    
    const { type, tabId, groupId } = selectedTreeNode;
    let oldName = "";
    
    if (type === 'tab') {
      const tab = tempRibbonLayout.find(t => t.id === tabId);
      if (tab) oldName = tab.label;
    } else if (type === 'group') {
      const tab = tempRibbonLayout.find(t => t.id === tabId);
      const group = tab?.groups.find(g => g.id === groupId);
      if (group) oldName = group.label;
    }
    
    const newName = prompt("Rename element:", oldName);
    if (!newName || newName.trim() === "") return;
    
    const newLayout = tempRibbonLayout.map(tab => {
      if (tab.id === tabId) {
        if (type === 'tab') {
          return { ...tab, label: newName.trim() };
        } else {
          const newGroups = tab.groups.map(group => {
            if (group.id === groupId) {
              return { ...group, label: newName.trim() };
            }
            return group;
          });
          return { ...tab, groups: newGroups };
        }
      }
      return tab;
    });
    setTempRibbonLayout(newLayout);
  };

  const handleToggleNodeVisibility = (tabId: string, groupId?: string) => {
    const newLayout = tempRibbonLayout.map(tab => {
      if (tab.id === tabId) {
        if (!groupId) {
          return { ...tab, visible: !tab.visible };
        } else {
          const newGroups = tab.groups.map(group => {
            if (group.id === groupId) {
              return { ...group, visible: !group.visible };
            }
            return group;
          });
          return { ...tab, groups: newGroups };
        }
      }
      return tab;
    });
    setTempRibbonLayout(newLayout);
  };

  const handleResetRibbonConfig = (mode: 'all' | 'selected') => {
    if (mode === 'all') {
      setTempRibbonLayout(defaultRibbonLayout);
    } else {
      if (!selectedTreeNode) return;
      const defaultTab = defaultRibbonLayout.find(t => t.id === selectedTreeNode.tabId);
      if (defaultTab) {
        const newLayout = tempRibbonLayout.map(t => {
          if (t.id === selectedTreeNode.tabId) {
            return JSON.parse(JSON.stringify(defaultTab));
          }
          return t;
        });
        setTempRibbonLayout(newLayout);
      } else {
        // If it's a custom tab, remove it
        const newLayout = tempRibbonLayout.filter(t => t.id !== selectedTreeNode.tabId);
        setTempRibbonLayout(newLayout);
        setSelectedTreeNode(null);
      }
    }
    setShowResetDropdown(false);
  };

  const handleExportRibbonConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tempRibbonLayout, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "custom_ribbon_settings.json");
    dlAnchorElem.click();
    setShowImportExportDropdown(false);
  };

  const handleImportRibbonConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setTempRibbonLayout(imported);
          alert("Ribbon configuration loaded successfully!");
        } else {
          throw new Error("Invalid format. Must be an array of tabs.");
        }
      } catch (err: any) {
        alert("Failed to import configuration: " + err.message);
      }
    };
    reader.readAsText(file);
    if (ribbonConfigFileInputRef.current) ribbonConfigFileInputRef.current.value = "";
    setShowImportExportDropdown(false);
  };

  useEffect(() => {
    setSelectedPlant(plant);
  }, [plant]);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('ess_smart_report_draft');
    if (savedDraft && editorRef.current) {
      editorRef.current.innerHTML = savedDraft;
      updateStats();
      saveToHistory(savedDraft);
    } else {
      loadInitialTemplate();
    }
  }, []);

  // Update statistics helper
  const updateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    
    // Character count
    setCharCount(text.length);
    
    // Word count
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  };

  // Content change auto-save & history handler
  const handleContentChange = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    
    // Auto-save to localStorage
    localStorage.setItem('ess_smart_report_draft', html);
    updateStats();

    if (!isHistoryAction) {
      saveToHistory(html);
    }
    setIsHistoryAction(false);
  };

  const saveToHistory = (html: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    // Limit history stack size to 50
    if (newHistory.length >= 50) {
      newHistory.shift();
    }
    newHistory.push(html);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setIsHistoryAction(true);
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[nextIndex];
        localStorage.setItem('ess_smart_report_draft', history[nextIndex]);
        updateStats();
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setIsHistoryAction(true);
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[nextIndex];
        localStorage.setItem('ess_smart_report_draft', history[nextIndex]);
        updateStats();
      }
    }
  };

  // Base64 helper for image insertion
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      insertHtmlAtCursor(`<img src="${base64}" alt="Uploaded report image" style="max-width: 100%; height: auto; border-radius: 4px; margin: 12px 0; border: 1px solid rgba(255,255,255,0.1);" />`);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Helper to execute standard commands
  const executeCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleContentChange();
    if (editorRef.current) editorRef.current.focus();
  };

  // Helper to insert HTML at cursor/selection
  const insertHtmlAtCursor = (html: string) => {
    if (editorRef.current) editorRef.current.focus();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      const fragment = range.createContextualFragment(html);
      const lastNode = fragment.lastChild;
      range.insertNode(fragment);
      
      // Move cursor right after the inserted node
      if (lastNode) {
        const newRange = document.createRange();
        newRange.setStartAfter(lastNode);
        newRange.setEndAfter(lastNode);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
      handleContentChange();
    }
  };

  // Markdown parsing utility to convert Gemini response to clean editor HTML
  const parseMarkdownToHtml = (markdown: string): string => {
    let html = markdown;

    // Remove block code wrappers and format as code block
    html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
      const escaped = code.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
      return `<pre class="report-code-block"><code>${escaped}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="report-inline-code">$1</code>');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 16px; font-weight: bold; margin-top: 16px; margin-bottom: 8px;">$1</h3>');
    html = html.replace(/^[#]{2} (.*$)/gim, '<h2 style="font-size: 18px; font-weight: bold; padding-bottom: 4px; margin-top: 20px; margin-bottom: 10px;">$1</h2>');
    html = html.replace(/^[#]{1} (.*$)/gim, '<h1 style="font-size: 22px; font-weight: bold; margin-top: 24px; margin-bottom: 12px;">$1</h1>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italics
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Horizontal Rule
    html = html.replace(/^---$/gim, '<hr style="margin: 16px 0;" />');

    // Blockquotes
    html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Bullet lists (simple mapping line by line)
    const lines = html.split('\n');
    let inList = false;
    let inOrderedList = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const itemContent = line.substring(2);
        if (!inList) {
          lines[i] = `<ul style="list-style-type: disc; padding-left: 20px; margin: 10px 0;"><li>${itemContent}</li>`;
          inList = true;
        } else {
          lines[i] = `<li>${itemContent}</li>`;
        }
      } else if (/^\d+\.\s/.test(line)) {
        const itemContent = line.replace(/^\d+\.\s/, '');
        if (!inOrderedList) {
          lines[i] = `<ol style="list-style-type: decimal; padding-left: 20px; margin: 10px 0;"><li>${itemContent}</li>`;
          inOrderedList = true;
        } else {
          lines[i] = `<li>${itemContent}</li>`;
        }
      } else {
        if (inList) {
          lines[i - 1] += '</ul>';
          inList = false;
        }
        if (inOrderedList) {
          lines[i - 1] += '</ol>';
          inOrderedList = false;
        }
        // Add paragraph wrapper if not empty and not HTML tag
        if (line.length > 0 && !line.startsWith('<')) {
          lines[i] = `<p style="margin: 8px 0; line-height: 1.6;">${lines[i]}</p>`;
        }
      }
    }
    
    if (inList) lines[lines.length - 1] += '</ul>';
    if (inOrderedList) lines[lines.length - 1] += '</ol>';

    return lines.join('\n');
  };

  const handleImportAiResponse = () => {
    if (!lastAiResponse) {
      alert("No AI response has been generated yet in this session.");
      return;
    }
    const html = parseMarkdownToHtml(lastAiResponse);
    insertHtmlAtCursor(`
      <div style="border: 1px dashed rgba(0, 163, 255, 0.3); background-color: rgba(0, 163, 255, 0.02); padding: 12px; border-radius: 4px; margin: 10px 0;">
        <div style="font-size: 10px; font-family: monospace; color: #00A3FF; margin-bottom: 6px; font-weight: bold; display: flex; items-center; gap: 4px;">
          <span>✦ IMPORTED AI RESPONSE</span>
        </div>
        ${html}
      </div>
    `);
  };

  // Queries IndexedDB for active project/plant evaluation data, and inserts a gorgeous SVG line plot of actual power/SOC telemetry!
  const handleImportActiveGraph = () => {
    const request = indexedDB.open('ESS_Toolbox', 1);
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('eval_data')) {
        insertDummyGraph();
        return;
      }
      const tx = db.transaction('eval_data', 'readonly');
      // Format key to match App.tsx mapping: eval_data_${project}
      // Note: project prop is "SNTL 400" or "SNTL 600" or "SNTK 1000", but key is "eval_data_SNTL400" (no spaces)
      const cleanProj = project.replace(/\s+/g, '');
      const req = tx.objectStore('eval_data').get(`eval_data_${cleanProj}`);
      
      req.onsuccess = () => {
        const data = req.result;
        if (data && data.timestamps && data.timestamps.length > 0) {
          generateSvgGraph(data);
        } else {
          console.warn("No IndexedDB data found. Inserting high-fidelity dummy template graph instead.");
          insertDummyGraph();
        }
      };
      req.onerror = () => insertDummyGraph();
    };
    request.onerror = () => insertDummyGraph();
  };

  const insertDummyGraph = () => {
    insertHtmlAtCursor(`
      <div class="report-graph-box">
        <div class="graph-title">
          <span>📊 Telemetry Performance Plot (Demo Mode)</span>
          <span style="color: #00A3FF; font-size: 10px; font-weight: normal;">${project} | ${selectedPlant.toUpperCase()}</span>
        </div>
        <div class="graph-canvas">
          <!-- Grid lines -->
          <div class="graph-gridline" style="bottom: 135px;"></div>
          <div class="graph-gridline" style="bottom: 90px;"></div>
          <div class="graph-gridline" style="bottom: 45px;"></div>
          
          <!-- Mock line chart using absolute overlay -->
          <svg style="position: absolute; top:0; left:0; width: 100%; height: 100%; overflow: visible;" viewBox="0 0 100 100" preserveAspectRatio="none">
            <!-- P total (Blue curve) -->
            <path d="M 0 50 L 15 25 L 30 20 L 45 60 L 60 70 L 75 40 L 90 35 L 100 45" fill="none" stroke="#00A3FF" stroke-width="2.5" />
            <!-- SOC (Orange curve) -->
            <path d="M 0 80 L 15 75 L 30 70 L 45 60 L 60 40 L 75 35 L 90 38 L 100 50" fill="none" stroke="#D95319" stroke-width="2" stroke-dasharray="3,3" />
          </svg>
        </div>
        <div class="graph-legend-text">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:55</span>
        </div>
        <div style="display: flex; gap: 12px; margin-top: 10px; justify-content: center; font-size: 9px;">
          <span style="display: flex; align-items: center; gap: 4px; color: #00A3FF;">
            <span style="display: inline-block; width: 8px; height: 8px; background: #00A3FF; border-radius: 2px;"></span> P total (MW)
          </span>
          <span style="display: flex; align-items: center; gap: 4px; color: #D95319;">
            <span style="display: inline-block; width: 8px; height: 2px; border-top: 2px dashed #D95319;"></span> SOC (%)
          </span>
        </div>
      </div>
    `);
  };

  const generateSvgGraph = (data: any) => {
    const pk = selectedPlant === 'plant1' ? 'plant1' : selectedPlant === 'plant2' ? 'plant2' : 'plant3';
    
    // Extrapolate series data
    const pTotalRaw = data.pTotal?.[pk] || [];
    const socRaw = data.soc?.[pk] || [];
    
    // Subsample arrays if they are huge to prevent HTML bloat (e.g. limit to 80 points)
    const step = Math.max(1, Math.ceil(pTotalRaw.length / 80));
    const pTotal: number[] = [];
    const soc: number[] = [];
    
    for (let i = 0; i < pTotalRaw.length; i += step) {
      pTotal.push(pTotalRaw[i]);
      soc.push(socRaw[i] || 50); // Fallback
    }

    if (pTotal.length === 0) {
      insertDummyGraph();
      return;
    }

    // Min and max limits for normalization
    const pMin = Math.min(...pTotal);
    const pMax = Math.max(...pTotal);
    const pRange = pMax - pMin === 0 ? 1 : pMax - pMin;

    const sMin = Math.min(...soc);
    const sMax = Math.max(...soc);
    const sRange = sMax - sMin === 0 ? 1 : sMax - sMin;

    // Build SVG path coordinate points
    const width = 450;
    const height = 150;
    const pointsCount = pTotal.length;

    let pPath = '';
    let socPath = '';

    for (let i = 0; i < pointsCount; i++) {
      const x = (i / (pointsCount - 1)) * width;
      // SVG Y starts at 0 (top). We flip Y: (1 - normalizedVal) * height
      const yP = (1 - (pTotal[i] - pMin) / pRange) * (height - 20) + 10;
      const yS = (1 - (soc[i] - sMin) / sRange) * (height - 20) + 10;

      if (i === 0) {
        pPath += `M ${x} ${yP}`;
        socPath += `M ${x} ${yS}`;
      } else {
        pPath += ` L ${x} ${yP}`;
        socPath += ` L ${x} ${yS}`;
      }
    }

    insertHtmlAtCursor(`
      <div class="report-graph-box">
        <div class="graph-title">
          <span>📊 Live Telemetry Graph (Grid Response Data)</span>
          <span style="color: #00A3FF; font-size: 10px; font-weight: normal;">${project} | ${selectedPlant.toUpperCase()} | Date: ${data.dataDate || '20-May-2026'}</span>
        </div>
        <div class="graph-lines-container" style="position: relative;">
          <!-- SVG element for clean vector graphics offline -->
          <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 180px; overflow: visible;">
            <!-- Grid lines -->
            <line x1="0" y1="${height * 0.25}" x2="${width}" y2="${height * 0.25}" stroke="currentColor" stroke-dasharray="3,3" style="opacity: 0.15;" />
            <line x1="0" y1="${height * 0.5}" x2="${width}" y2="${height * 0.5}" stroke="currentColor" stroke-dasharray="3,3" style="opacity: 0.15;" />
            <line x1="0" y1="${height * 0.75}" x2="${width}" y2="${height * 0.75}" stroke="currentColor" stroke-dasharray="3,3" style="opacity: 0.15;" />
            
            <!-- P total (Blue Line) -->
            <path d="${pPath}" fill="none" stroke="#00A3FF" stroke-width="2" />
            <!-- SOC (Orange Line) -->
            <path d="${socPath}" fill="none" stroke="#D95319" stroke-width="1.8" stroke-dasharray="4,4" />
          </svg>
        </div>
        <div class="graph-legend-text" style="padding-left: 2px;">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:55</span>
        </div>
        <div style="display: flex; gap: 16px; margin-top: 10px; justify-content: center; font-size: 9px;">
          <span style="display: flex; align-items: center; gap: 4px; color: #00A3FF;">
            <span style="display: inline-block; width: 8px; height: 8px; background: #00A3FF; border-radius: 2px;"></span> P total (MW) [${pMin.toFixed(1)} to ${pMax.toFixed(1)}]
          </span>
          <span style="display: flex; align-items: center; gap: 4px; color: #D95319;">
            <span style="display: inline-block; width: 8px; height: 2px; border-top: 2px dashed #D95319;"></span> SOC (%) [${sMin.toFixed(0)}% to ${sMax.toFixed(0)}%]
          </span>
        </div>
      </div>
    `);
  };

  // Pre-formatted templates
  const loadTemplate = (type: 'bess' | 'stability' | 'blank') => {
    let html = '';
    
    if (type === 'bess') {
      html = `
        <h1 style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 5px;">BESS OPERATION PERFORMANCE REPORT</h1>
        <p style="text-align: center; font-size: 11px; font-family: monospace; margin-bottom: 25px; color: #888888;">PROJECT: ${project} | PLANT: ${selectedPlant.toUpperCase()} | DATE: 20-May-2026</p>
        
        <h2 style="font-size: 16px; font-weight: bold; margin-top: 20px; padding-bottom: 4px;">1. EXECUTIVE SUMMARY</h2>
        <p style="line-height: 1.6; margin: 8px 0;">This operational summary evaluates the frequency response and Battery Energy Storage System (BESS) charging/discharging performance metrics. Telemetry charts indicate normal operation under secondary frequency regulation commands.</p>
        
        <div class="report-callout report-callout-info">
          <strong>Operational Status:</strong> All plant subsystems (SWG01, SWG02, SWG03) are operating within target specifications. No frequency deadband violations were identified during the audit period.
        </div>

        <h2 style="font-size: 16px; font-weight: bold; margin-top: 25px; padding-bottom: 4px;">2. PLANT METRICS OVERVIEW</h2>
        <table class="report-table">
          <thead>
            <tr>
              <th>Subsystem ID</th>
              <th>Max Active Power (MW)</th>
              <th>Daily Cycle Count</th>
              <th>Min SOC (%)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>SWG01 (Plant 01)</td>
              <td>15.2 MW</td>
              <td>1.23</td>
              <td>46.0%</td>
              <td style="color: #22C55E; font-weight: bold;">✓ Optimal</td>
            </tr>
            <tr>
              <td>SWG02 (Plant 02)</td>
              <td>14.8 MW</td>
              <td>1.18</td>
              <td>56.0%</td>
              <td style="color: #22C55E; font-weight: bold;">✓ Optimal</td>
            </tr>
            <tr>
              <td>SWG03 (Plant 03)</td>
              <td>12.5 MW</td>
              <td>1.32</td>
              <td>66.0%</td>
              <td style="color: #22C55E; font-weight: bold;">✓ Optimal</td>
            </tr>
          </tbody>
        </table>

        <h2 style="font-size: 16px; font-weight: bold; margin-top: 25px; padding-bottom: 4px;">3. REMARKS & ACTION ITEMS</h2>
        <ul style="list-style-type: square; padding-left: 20px; margin: 10px 0; line-height: 1.6;">
          <li>Review remote power feedback lag timings.</li>
          <li>Calibrate charge rate limiting coefficients for summer limits.</li>
          <li>Extract BESS log records for high-deviation instances.</li>
        </ul>
      `;
    } else if (type === 'stability') {
      html = `
        <h1 style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 5px;">GRID STABILITY & FREQUENCY AUDIT</h1>
        <p style="text-align: center; font-size: 11px; font-family: monospace; margin-bottom: 25px; color: #888888;">DOCUMENT TYPE: GRID ENGINEERING SYSTEM REVIEW | PROJECT: ${project}</p>
        
        <h2 style="font-size: 16px; font-weight: bold; margin-top: 20px; padding-bottom: 4px; color: #EF4444; border-bottom: 1px solid rgba(239, 68, 68, 0.2);">1. CRITICAL INCIDENT AUDIT</h2>
        <p style="line-height: 1.6; margin: 8px 0;">This analysis targets voltage fluctuations, active power flow checks, and command compliance during frequency transients.</p>
        
        <div class="report-callout report-callout-error">
          <strong>CAUTION:</strong> Active power mismatch detected at plant SWG01 during maximum power dispatch ramp up at 14:35. Mismatch reached 0.82 MW.
        </div>

        <h2 style="font-size: 16px; font-weight: bold; margin-top: 25px; padding-bottom: 4px; color: #EF4444; border-bottom: 1px solid rgba(239, 68, 68, 0.2);">2. MITIGATION CHECKLIST</h2>
        <ol style="list-style-type: decimal; padding-left: 20px; margin: 10px 0; line-height: 1.6;">
          <li>Adjust ramp allocation deadbands.</li>
          <li>Tune voltage droop compensation parameters.</li>
          <li>Verify NCC command telemetry communication packet rates.</li>
        </ol>
      `;
    } else {
      html = `<p><br></p>`;
    }

    if (editorRef.current) {
      editorRef.current.innerHTML = html;
      localStorage.setItem('ess_smart_report_draft', html);
      updateStats();
      saveToHistory(html);
    }
    setShowTemplateModal(false);
  };

  const loadInitialTemplate = () => {
    loadTemplate('bess');
  };

  // Inserting Link
  const handleInsertLink = () => {
    if (!linkUrl) return;
    executeCommand('createLink', linkUrl);
    setShowLinkModal(false);
    setLinkUrl('');
  };

  // Inserting Table
  const handleInsertTable = () => {
    let tableHtml = `<table class="report-table">`;
    
    // Headers
    tableHtml += `<thead><tr>`;
    for (let c = 0; c < tableCols; c++) {
      tableHtml += `<th>Header ${c + 1}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;

    // Rows
    for (let r = 0; r < tableRows; r++) {
      tableHtml += `<tr>`;
      for (let c = 0; c < tableCols; c++) {
        tableHtml += `<td>Data</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table>`;
    
    insertHtmlAtCursor(tableHtml);
    setShowTableModal(false);
  };

  // Inserting Callout Boxes
  const handleInsertCallout = () => {
    const textMap = {
      info: 'INFO',
      warning: 'WARNING',
      error: 'ALERT'
    };
    
    const html = `
      <div class="report-callout report-callout-${calloutType}">
        <strong style="color: inherit; font-size: 11px; tracking-wide: 0.05em; font-family: monospace; display: block; margin-bottom: 4px;">${textMap[calloutType]}</strong>
        Enter callout message details here...
      </div>
    `;
    insertHtmlAtCursor(html);
    setShowCalloutModal(false);
  };

  const handleClearDoc = () => {
    if (window.confirm("Are you sure you want to clear the entire document? This cannot be undone.")) {
      if (editorRef.current) {
        editorRef.current.innerHTML = '<p><br></p>';
        localStorage.removeItem('ess_smart_report_draft');
        updateStats();
        saveToHistory('<p><br></p>');
      }
    }
  };

  // Print/PDF trigger
  const handlePrint = () => {
    window.print();
  };

  // HTML Export download
  const handleExportHtml = () => {
    if (!editorRef.current) return;
    const body = editorRef.current.innerHTML;
    
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EMS Toolbox - Smart Report Export</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #333333;
      background-color: #ffffff;
      line-height: 1.6;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
    }
    h1, h2, h3 {
      font-family: 'Helvetica Neue', Helvetica, sans-serif;
      color: #111111;
    }
    h1 {
      border-bottom: 2px solid #00A3FF;
      padding-bottom: 10px;
      font-size: 28px;
    }
    h2 {
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 5px;
      font-size: 20px;
      margin-top: 30px;
      color: #0072BD;
    }
    p {
      margin: 10px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #cccccc;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #fcfcfc;
    }
    blockquote {
      border-left: 4px solid #00A3FF;
      padding-left: 15px;
      margin-left: 0;
      font-style: italic;
      color: #555555;
    }

    /* Report custom element styles */
    .report-callout {
      padding: 12px;
      margin: 15px 0;
      border-radius: 0 4px 4px 0;
      font-family: sans-serif;
      font-size: 13px;
    }
    .report-callout-info {
      background-color: rgba(0, 163, 255, 0.04);
      border-left: 4px solid #00A3FF;
      color: #1E293B;
    }
    .report-callout-warning {
      background-color: rgba(234, 179, 8, 0.04);
      border-left: 4px solid #EAB308;
      color: #1E293B;
    }
    .report-callout-error {
      background-color: rgba(239, 68, 68, 0.04);
      border-left: 4px solid #EF4444;
      color: #1E293B;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 12px;
      text-align: left;
    }
    .report-table th, .report-table td {
      padding: 8px;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }
    .report-table thead tr {
      background-color: rgba(0, 0, 0, 0.03);
      border-bottom: 2px solid rgba(0, 0, 0, 0.1);
    }
    .report-table tbody tr:nth-child(even) {
      background-color: rgba(0, 0, 0, 0.015);
    }

    .report-code-block {
      background-color: rgba(0, 0, 0, 0.03);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-left: 4px solid #00A3FF;
      padding: 12px;
      font-family: monospace;
      font-size: 12px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 12px 0;
      color: #1E293B;
      white-space: pre-wrap;
    }
    .report-inline-code {
      background-color: rgba(0, 0, 0, 0.05);
      padding: 2px 5px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.9em;
      border: 1px solid rgba(0, 0, 0, 0.08);
      color: #0072BD;
    }

    .engineering-signoff-box {
      border: 1.5px solid rgba(0, 0, 0, 0.1);
      border-radius: 6px;
      padding: 18px;
      margin: 20px 0;
      background-color: rgba(0, 0, 0, 0.015);
      font-family: sans-serif;
      page-break-inside: avoid;
      color: #1E293B;
    }
    .signoff-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .signoff-table td {
      padding: 6px 0;
      border: none !important;
    }
    .signoff-label {
      color: rgba(0, 0, 0, 0.5);
    }

    .page-break {
      border: 1px dashed #cbd5e1;
      margin: 24px 0;
      height: 0;
      border-top: 1px dashed #cbd5e1;
    }

    .report-graph-box {
      border: 1px solid rgba(0, 0, 0, 0.1);
      background-color: #F8FAFC;
      border-radius: 6px;
      padding: 16px;
      margin: 16px 0;
      max-width: 600px;
      font-family: sans-serif;
      page-break-inside: avoid;
      color: #1E293B;
    }
    .graph-title {
      font-weight: bold;
      font-size: 12px;
      color: #1E293B;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      padding-bottom: 6px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
    }
    .graph-canvas {
      height: 180px;
      width: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      border-left: 2px solid rgba(0, 0, 0, 0.2);
      border-bottom: 2px solid rgba(0, 0, 0, 0.2);
      padding-bottom: 5px;
      position: relative;
    }
    .graph-gridline {
      position: absolute;
      width: 100%;
      height: 1px;
      border-top: 1px dashed rgba(0, 0, 0, 0.06);
    }
    .graph-legend-text {
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      color: rgba(0, 0, 0, 0.5);
      margin-top: 6px;
      font-family: monospace;
    }
    .graph-lines-container {
      color: #1E293B;
      border-left: 2px solid rgba(0, 0, 0, 0.2);
      border-bottom: 2px solid rgba(0, 0, 0, 0.2);
      padding-bottom: 5px;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  ${body}
</body>
</html>`;

    // Trigger download
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Smart_Report_${project.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Convert HTML back to markdown regex utility
  const handleExportMarkdown = () => {
    if (!editorRef.current) return;
    let html = editorRef.current.innerHTML;

    // Convert HTML elements back to simple markdown structure
    let md = html;
    md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n');
    md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n');
    md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n');
    md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '> $1\n\n');
    md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');
    md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '* $1\n');
    md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, '$1\n');
    md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, '$1\n');
    md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
    md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
    md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');
    md = md.replace(/<hr[^>]*>/gi, '---\n\n');
    md = md.replace(/<br\s*\/?>/gi, '\n');
    md = md.replace(/<[^>]+>/g, ''); // strip remaining tags

    // Decode HTML entities
    md = md.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

    const blob = new Blob([md.trim()], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Smart_Report_${project.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderIcon = (name: string, size = 16) => {
    switch (name) {
      case 'Font': return <FileText size={size} />;
      case 'TextSize': return <FileText size={size} />;
      case 'Bold': return <Bold size={size} />;
      case 'Italic': return <Italic size={size} />;
      case 'Underline': return <Underline size={size} />;
      case 'Strikethrough': return <Strikethrough size={size} />;
      case 'Palette': return <Sparkles size={size} />;
      case 'AlignLeft': return <AlignLeft size={size} />;
      case 'AlignCenter': return <AlignCenter size={size} />;
      case 'AlignRight': return <AlignRight size={size} />;
      case 'AlignJustify': return <AlignJustify size={size} />;
      case 'List': return <List size={size} />;
      case 'ListOrdered': return <ListOrdered size={size} />;
      case 'ArrowRightToLine': return <ArrowRightToLine size={size} className="rotate-90" />;
      case 'PB': return <span className="font-bold text-[9px] text-foreground/80 bg-foreground/10 px-1 rounded select-none">PB</span>;
      case 'Table': return <Table size={size} />;
      case 'Image': return <Image size={size} />;
      case 'LinkIcon': return <LinkIcon size={size} />;
      case 'Link2Off': return <Link2Off size={size} />;
      case 'AlertCircle': return <AlertCircle size={size} />;
      case 'Code': return <Code size={size} />;
      case 'Sparkles': return <Sparkles size={size} />;
      case 'FileSpreadsheet': return <FileSpreadsheet size={size} />;
      case 'Upload': return <Upload size={size} />;
    }

    const IconComponent = (Icons as any)[name];
    if (IconComponent) {
      return <IconComponent size={size} />;
    }

    if (name === 'signature_sign_off_default' || name === 'signature_sign_off') {
      return <Icons.PenTool size={size} className="text-blue-400" />;
    }
    
    return <Icons.Settings size={size} />;
  };

  const renderRibbonCommandItem = (cmd: RibbonCommand) => {
    if (cmd.id === 'font_family') {
      return (
        <select 
          key={cmd.id}
          value={activeFont}
          onChange={(e) => {
            setActiveFont(e.target.value);
            executeCommand('fontName', e.target.value);
          }}
          className="h-7 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/60 rounded text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-accent-blue/30 text-[10px] w-32 pl-2 pr-6 cursor-pointer outline-none transition-colors"
          title="Font Family"
        >
          <option value="Arial" className="bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-200">Arial</option>
          <option value="Times New Roman" className="bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-200">Times New Roman</option>
          <option value="Courier New" className="bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-200">Courier</option>
          <option value="Georgia" className="bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-200">Georgia</option>
          <option value="Inter" className="bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-200">Inter</option>
          <option value="JetBrains Mono" className="bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-200">JetBrains</option>
        </select>
      );
    }
    
    if (cmd.id === 'font_size') {
      return (
        <select 
          key={cmd.id}
          value={activeSize}
          onChange={(e) => {
            setActiveSize(e.target.value);
            const sizeMap: Record<string, string> = { '12px': '2', '14px': '3', '16px': '4', '18px': '5', '24px': '6', '32px': '7' };
            executeCommand('fontSize', sizeMap[e.target.value] || '3');
          }}
          className="h-7 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/60 rounded text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-accent-blue/30 text-[10px] w-20 pl-2 pr-6 cursor-pointer outline-none transition-colors"
          title="Font Size"
        >
          <option value="12px" className="bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-200">12px</option>
          <option value="14px" className="bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-200">14px</option>
          <option value="16px" className="bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-200">16px</option>
          <option value="18px" className="bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-200">18px</option>
          <option value="24px" className="bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-200">24px</option>
          <option value="32px" className="bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-200">32px</option>
        </select>
      );
    }
    
    if (cmd.id === 'colors') {
      return (
        <div key={cmd.id} className="flex items-center gap-1 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/60 rounded px-1.5 h-7" title="Text & Highlight Color">
          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold font-sans">A</span>
          <input 
            type="color" 
            onChange={(e) => executeCommand('foreColor', e.target.value)} 
            className="w-3.5 h-3.5 bg-transparent border-0 rounded-full cursor-pointer p-0 overflow-hidden" 
            title="Text Color" 
            defaultValue="#FFFFFF"
          />
          <div className="w-px h-3 bg-slate-200 dark:bg-slate-700/60" />
          <input 
            type="color" 
            onChange={(e) => executeCommand('hiliteColor', e.target.value)} 
            className="w-3.5 h-3.5 bg-transparent border-0 rounded-full cursor-pointer p-0 overflow-hidden" 
            title="Highlight Color" 
            defaultValue="#0F172A"
          />
        </div>
      );
    }
    
    if (cmd.id === 'bess_graph') {
      return (
        <div key={cmd.id} className="flex items-center bg-green-500/5 border border-green-500/20 rounded h-7 px-1">
          <select 
            value={selectedPlant}
            onChange={(e) => setSelectedPlant(e.target.value)}
            className="h-full bg-transparent border-0 text-[10px] w-20 px-1 cursor-pointer focus:ring-0 text-green-400 font-bold shrink-0 outline-none"
            title="Active Plant for Graph Import"
          >
            <option value="plant1" className="bg-surface text-foreground">Plant 1</option>
            <option value="plant2" className="bg-surface text-foreground">Plant 2</option>
            {project !== 'SNTL 400' && (
              <option value="plant3" className="bg-surface text-foreground">Plant 3</option>
            )}
          </select>
          <div className="w-px h-4 bg-green-500/20 shrink-0" />
          <button 
            onClick={() => handleRibbonCommand('bess_graph')}
            className="h-full px-2 hover:bg-green-500/10 text-green-400 flex items-center gap-1.5 rounded-r text-[10px] font-bold shrink-0 transition-colors"
            title="Insert vector SVG graph plot of current project telemetry dataset"
          >
            <FileSpreadsheet size={11} /> +BESS Graph
          </button>
        </div>
      );
    }

    const isCustomTool = cmd.id.startsWith('tool_');
    const toolId = isCustomTool ? cmd.id.substring(5) : cmd.id;
    
    if (isCustomTool) {
      const tool = customTools.find(t => t.id === toolId);
      const displayName = tool ? tool.name : cmd.label;
      const shortName = tool?.shortName || tool?.name || cmd.label;
      
      return (
        <button
          key={cmd.id}
          onClick={() => handleRibbonCommand(cmd.id)}
          className="flex flex-col items-center justify-center h-11 min-w-[56px] px-1 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-800/60 active:bg-slate-300 dark:active:bg-slate-800 text-foreground/75 dark:text-slate-300 hover:text-foreground dark:hover:text-white border border-transparent rounded transition-all select-none gap-0.5 shrink-0"
          title={displayName}
        >
          {renderIcon(tool?.iconName || 'Settings', 14)}
          <span className="text-[8px] font-medium tracking-tight font-sans text-center leading-none max-w-[52px] truncate">{shortName}</span>
        </button>
      );
    }

    // Default icon-only buttons
    const icon = renderIcon(cmd.iconName, 13);
    return (
      <button 
        key={cmd.id}
        onClick={() => handleRibbonCommand(cmd.id)}
        className="h-7 w-7 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-foreground dark:hover:text-white active:bg-slate-300 dark:active:bg-slate-700 text-foreground/75 flex items-center justify-center rounded transition-colors"
        title={cmd.label}
      >
        {icon}
      </button>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-background relative min-w-0 h-full overflow-hidden text-foreground">
      {/* Editor Stylesheet for printing and theme overrides */}
      <style>{`

        /* Default adaptive typography and structure inside the editor */
        #print-area-wrapper h1 {
          color: #1E293B;
        }
        .dark #print-area-wrapper h1 {
          color: #FFFFFF;
        }
        #print-area-wrapper h2 {
          color: #1E293B;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }
        .dark #print-area-wrapper h2 {
          color: #00A3FF;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        #print-area-wrapper h3 {
          color: #0072BD;
        }
        .dark #print-area-wrapper h3 {
          color: #00A3FF;
        }

        /* Callout Boxes */
        .report-callout {
          padding: 12px;
          margin: 15px 0;
          border-radius: 0 4px 4px 0;
          font-family: sans-serif;
          font-size: 13px;
        }
        .report-callout-info {
          background-color: rgba(0, 163, 255, 0.04);
          border-left: 4px solid #00A3FF;
          color: #1E293B;
        }
        .dark .report-callout-info {
          background-color: rgba(0, 163, 255, 0.06);
          color: #E2E8F0;
        }
        .report-callout-warning {
          background-color: rgba(234, 179, 8, 0.04);
          border-left: 4px solid #EAB308;
          color: #1E293B;
        }
        .dark .report-callout-warning {
          background-color: rgba(234, 179, 8, 0.06);
          color: #E2E8F0;
        }
        .report-callout-error {
          background-color: rgba(239, 68, 68, 0.04);
          border-left: 4px solid #EF4444;
          color: #1E293B;
        }
        .dark .report-callout-error {
          background-color: rgba(239, 68, 68, 0.06);
          color: #E2E8F0;
        }

        /* Tables */
        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 12px;
          text-align: left;
        }
        .report-table th, .report-table td {
          padding: 8px;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        .dark .report-table th, .dark .report-table td {
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .report-table thead tr {
          background-color: rgba(0, 0, 0, 0.03);
          border-bottom: 2px solid rgba(0, 0, 0, 0.1);
        }
        .dark .report-table thead tr {
          background-color: rgba(255, 255, 255, 0.05);
          border-bottom: 2px solid rgba(255, 255, 255, 0.15);
        }
        .report-table tbody tr:nth-child(even) {
          background-color: rgba(0, 0, 0, 0.015);
        }
        .dark .report-table tbody tr:nth-child(even) {
          background-color: rgba(255, 255, 255, 0.02);
        }

        /* Code Blocks */
        .report-code-block {
          background-color: rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-left: 4px solid #00A3FF;
          padding: 12px;
          font-family: monospace;
          font-size: 12px;
          border-radius: 4px;
          overflow-x: auto;
          margin: 12px 0;
          color: #1E293B;
          white-space: pre-wrap;
        }
        .dark .report-code-block {
          background-color: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #E0E0E0;
        }
        .report-inline-code {
          background-color: rgba(0, 0, 0, 0.05);
          padding: 2px 5px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9em;
          border: 1px solid rgba(0, 0, 0, 0.08);
          color: #0072BD;
        }
        .dark .report-inline-code {
          background-color: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #00A3FF;
        }

        /* Engineering Sign-off Box */
        .engineering-signoff-box {
          border: 1.5px solid rgba(0, 0, 0, 0.1);
          border-radius: 6px;
          padding: 18px;
          margin: 20px 0;
          background-color: rgba(0, 0, 0, 0.015);
          font-family: sans-serif;
          page-break-inside: avoid;
          color: #1E293B;
        }
        .dark class .engineering-signoff-box,
        .dark .engineering-signoff-box {
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          background-color: rgba(255, 255, 255, 0.02);
          color: #FFFFFF;
        }
        .signoff-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .signoff-table td {
          padding: 6px 0;
          border: none !important;
        }
        .signoff-label {
          color: rgba(0, 0, 0, 0.5);
        }
        .dark .signoff-label {
          color: rgba(255, 255, 255, 0.5);
        }

        /* Page Break */
        .page-break {
          border: 1px dashed #cbd5e1;
          margin: 24px 0;
          height: 0;
          border-top: 1px dashed #cbd5e1;
        }
        .dark .page-break {
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-top: 1px dashed #475569;
        }

        /* Telemetry Graphs */
        .report-graph-box {
          border: 1px solid rgba(0, 0, 0, 0.1);
          background-color: #F8FAFC;
          border-radius: 6px;
          padding: 16px;
          margin: 16px 0;
          max-width: 600px;
          font-family: sans-serif;
          page-break-inside: avoid;
          color: #1E293B;
        }
        .dark .report-graph-box {
          border: 1px solid rgba(255, 255, 255, 0.1);
          background-color: #151F32;
          color: #FFFFFF;
        }
        .graph-title {
          font-weight: bold;
          font-size: 12px;
          color: #1E293B;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          padding-bottom: 6px;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
        }
        .dark .graph-title {
          color: #FFFFFF;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .graph-canvas {
          height: 180px;
          width: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          border-left: 2px solid rgba(0, 0, 0, 0.2);
          border-bottom: 2px solid rgba(0, 0, 0, 0.2);
          padding-bottom: 5px;
          position: relative;
        }
        .dark .graph-canvas {
          border-left: 2px solid rgba(255, 255, 255, 0.2);
          border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        }
        .graph-gridline {
          position: absolute;
          width: 100%;
          height: 1px;
          border-top: 1px dashed rgba(0, 0, 0, 0.06);
        }
        .dark .graph-gridline {
          border-top: 1px dashed rgba(255, 255, 255, 0.06);
        }
        .graph-legend-text {
          display: flex;
          justify-content: space-between;
          font-size: 8px;
          color: rgba(0, 0, 0, 0.5);
          margin-top: 6px;
          font-family: monospace;
        }
        .dark .graph-legend-text {
          color: rgba(255, 255, 255, 0.4);
        }
        .graph-lines-container {
          color: #1E293B;
          border-left: 2px solid rgba(0, 0, 0, 0.2);
          border-bottom: 2px solid rgba(0, 0, 0, 0.2);
          padding-bottom: 5px;
        }
        .dark .graph-lines-container {
          color: #E2E8F0;
          border-left: 2px solid rgba(255, 255, 255, 0.2);
          border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        }

        @media print {
          body * {
            visibility: hidden;
          }
          #print-area-wrapper, #print-area-wrapper * {
            visibility: visible;
          }
          #print-area-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background-color: white !important;
            color: black !important;
            box-shadow: none !important;
            border: 0 !important;
            padding: 0 !important;
          }
          #print-area-wrapper h1, #print-area-wrapper h2, #print-area-wrapper h3, #print-area-wrapper p, #print-area-wrapper td, #print-area-wrapper th, #print-area-wrapper li {
            color: black !important;
          }
          #print-area-wrapper table, #print-area-wrapper th, #print-area-wrapper td {
            border: 1px solid #666666 !important;
          }
          #print-area-wrapper .page-break {
            page-break-before: always !important;
            border: 0 !important;
            height: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Main Top Header */}
      <div className="px-4 h-14 flex items-center justify-between border-b border-border-v bg-surface/50 shrink-0 select-none">
        <div className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-2">
          <FileText size={14} className="text-accent-blue" />
          Smart Report Document Engine
        </div>
        
        {/* Undo/Redo & Utility icons */}
        <div className="flex items-center gap-1">
          <button 
            onClick={handleUndo} 
            disabled={historyIndex <= 0} 
            className="h-7 w-7 rounded flex items-center justify-center hover:bg-foreground/5 text-foreground/60 hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
            title="Undo"
          >
            <Undo2 size={14} />
          </button>
          <button 
            onClick={handleRedo} 
            disabled={historyIndex >= history.length - 1} 
            className="h-7 w-7 rounded flex items-center justify-center hover:bg-foreground/5 text-foreground/60 hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
            title="Redo"
          >
            <Redo2 size={14} />
          </button>
          
          <div className="w-px h-4 bg-border-v mx-1.5" />
          
          <button 
            onClick={() => setShowTemplateModal(true)} 
            className="h-7 px-2 text-[10px] uppercase font-bold tracking-widest text-accent-blue border border-accent-blue/30 bg-accent-blue/5 hover:bg-accent-blue/10 rounded-sm flex items-center gap-1 transition-colors"
            title="Templates"
          >
            <Sparkles size={11} /> Templates
          </button>
        </div>
      </div>

      {/* Word-like Ribbon Toolbar */}
      <div className="bg-slate-50 dark:bg-[#131B2E] border-b border-border-v flex flex-col shrink-0 select-none text-[11px] font-mono shadow-sm">
        {/* Tabs Headers Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-slate-100 dark:bg-[#0F172A] px-2 h-8">
          <div className="flex items-center">
            {ribbonLayout.filter(tab => tab.visible).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveRibbonTab(tab.id)}
                className={cn(
                  "px-4 h-8 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 outline-none",
                  activeRibbonTab === tab.id 
                    ? "text-accent-blue border-accent-blue bg-slate-50 dark:bg-[#131B2E]" 
                    : "text-foreground/50 border-transparent hover:text-foreground hover:bg-foreground/5"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Settings cog to open Ribbon Customizer */}
          <button
            onClick={handleOpenRibbonCustomizer}
            className="flex items-center gap-1.5 px-3 h-7 text-[10px] text-foreground/60 hover:text-foreground hover:bg-foreground/5 rounded transition-all font-bold uppercase tracking-wider"
            title="Customize the Ribbon Toolbar commands and tabs"
          >
            <Settings size={12} /> Customize Ribbon
          </button>
        </div>

        {/* Tab content ribbon area */}
        <div className="px-3 h-[84px] py-1 bg-slate-50 dark:bg-[#131B2E] border-t border-slate-200 dark:border-slate-900/40 flex items-stretch gap-4 overflow-x-auto scrollbar-clean select-none">
          {ribbonLayout.find(tab => tab.id === activeRibbonTab)?.groups.filter(g => g.visible).map(group => (
            <div key={group.id} className="flex flex-col justify-between border-r border-slate-350 dark:border-slate-850/60 pr-3.5 last:border-0 relative pb-4 shrink-0 min-w-[40px] h-[72px]">
              <div className="flex items-center gap-1.5 h-11">
                {group.commands.map(cmd => renderRibbonCommandItem(cmd))}
              </div>
              <span className="absolute bottom-0.5 left-0 right-0 text-center text-[7.5px] uppercase tracking-widest text-slate-500 font-semibold font-sans select-none pointer-events-none">
                {group.label}
              </span>
            </div>
          ))}
          {(!ribbonLayout.find(tab => tab.id === activeRibbonTab)?.groups.some(g => g.visible)) && (
            <div className="text-[10px] text-foreground/30 font-bold uppercase pl-2 font-sans self-center">
              No visible groups in this tab. Click "Customize Ribbon" to configure.
            </div>
          )}
        </div>
      </div>

      {/* Page Canvas Container - Styled like a premium word processor page layout */}
      <div className="flex-1 overflow-y-auto scrollbar-clean bg-slate-100 dark:bg-slate-900/60 p-6 md:p-8 flex justify-center">
        <div 
          id="print-area-wrapper"
          className="w-full max-w-[800px] min-h-[1050px] bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/60 rounded-md shadow-2xl p-10 md:p-14 text-sm font-sans focus:outline-none overflow-y-visible"
          contentEditable
          ref={editorRef}
          onInput={handleContentChange}
          style={{ 
            color: theme === 'dark' ? '#E2E8F0' : '#1E293B',
            lineHeight: '1.6',
            boxShadow: theme === 'dark' ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
          }}
        />
      </div>

      {/* Footer Word/Character Statistics status bar */}
      <div className="h-8 border-t border-border-v bg-surface/70 px-4 flex items-center justify-between text-[10px] font-mono text-foreground/50 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span>Words: <strong>{wordCount}</strong></span>
          <span className="text-foreground/20">|</span>
          <span>Chars: <strong>{charCount}</strong></span>
        </div>
        
        {/* Action Panel options */}
        <div className="flex items-center gap-4">
          <button onClick={handleClearDoc} className="text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors" title="Reset/Clear all content">
            <Trash2 size={12} /> Clear Doc
          </button>
          <button onClick={handlePrint} className="text-foreground/60 hover:text-foreground flex items-center gap-1.5 transition-colors" title="Print document or save as PDF">
            <Printer size={12} /> Print/PDF
          </button>
          <div className="flex items-center gap-2 border-l border-border-v pl-3">
            <button onClick={handleExportHtml} className="text-accent-blue hover:text-blue-400 flex items-center gap-1 transition-colors" title="Download report as HTML file">
              <FileDown size={12} /> Export HTML
            </button>
            <button onClick={handleExportMarkdown} className="text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors" title="Download report as Markdown file">
              <FileDown size={12} /> Export MD
            </button>
          </div>
        </div>
      </div>

      {/* POPUP MODAL: Table Grid Creator */}
      {showTableModal && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface border border-border-v rounded-md p-5 w-72 flex flex-col gap-4 shadow-2xl">
            <div className="font-bold text-xs uppercase tracking-wider text-foreground border-b border-border-v pb-2 flex items-center gap-1.5">
              <Table size={14} className="text-accent-blue" />
              Insert Table
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
              <div className="flex flex-col gap-1">
                <span className="text-foreground/50">Rows</span>
                <input 
                  type="number" 
                  min="1" 
                  max="20" 
                  value={tableRows} 
                  onChange={(e) => setTableRows(Math.max(1, parseInt(e.target.value) || 1))} 
                  className="h-8 bg-background border border-border-v rounded px-2 text-foreground text-xs outline-none focus:border-accent-blue"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-foreground/50">Columns</span>
                <input 
                  type="number" 
                  min="1" 
                  max="10" 
                  value={tableCols} 
                  onChange={(e) => setTableCols(Math.max(1, parseInt(e.target.value) || 1))} 
                  className="h-8 bg-background border border-border-v rounded px-2 text-foreground text-xs outline-none focus:border-accent-blue"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-v">
              <button 
                onClick={() => setShowTableModal(false)}
                className="h-7 px-3 text-[10px] text-foreground/60 hover:text-foreground transition-colors uppercase font-bold tracking-wider"
              >
                Cancel
              </button>
              <button 
                onClick={handleInsertTable}
                className="h-7 px-3 bg-accent-blue hover:bg-blue-600 rounded text-white text-[10px] transition-colors uppercase font-bold tracking-wider"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Insert Link URL */}
      {showLinkModal && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface border border-border-v rounded-md p-5 w-80 flex flex-col gap-4 shadow-2xl">
            <div className="font-bold text-xs uppercase tracking-wider text-foreground border-b border-border-v pb-2 flex items-center gap-1.5">
              <LinkIcon size={14} className="text-accent-blue" />
              Insert Hyperlink
            </div>
            
            <div className="flex flex-col gap-1 text-[11px] font-mono">
              <span className="text-foreground/50">Link URL</span>
              <input 
                type="text" 
                placeholder="https://example.com" 
                value={linkUrl} 
                onChange={(e) => setLinkUrl(e.target.value)} 
                className="h-8 bg-background border border-border-v rounded px-2 text-foreground text-xs outline-none focus:border-accent-blue"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-v">
              <button 
                onClick={() => setShowLinkModal(false)}
                className="h-7 px-3 text-[10px] text-foreground/60 hover:text-foreground transition-colors uppercase font-bold tracking-wider"
              >
                Cancel
              </button>
              <button 
                onClick={handleInsertLink}
                className="h-7 px-3 bg-accent-blue hover:bg-blue-600 rounded text-white text-[10px] transition-colors uppercase font-bold tracking-wider"
              >
                Apply Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Insert Callout Box */}
      {showCalloutModal && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface border border-border-v rounded-md p-5 w-72 flex flex-col gap-4 shadow-2xl">
            <div className="font-bold text-xs uppercase tracking-wider text-foreground border-b border-border-v pb-2 flex items-center gap-1.5">
              <AlertCircle size={14} className="text-accent-blue" />
              Insert Callout Box
            </div>
            
            <div className="flex flex-col gap-1.5 text-[11px] font-mono">
              <span className="text-foreground/50">Callout Level</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCalloutType('info')} 
                  className={cn("flex-1 h-7 rounded text-[10px] font-bold transition-all border", calloutType === 'info' ? "bg-blue-500/10 border-blue-500 text-blue-400" : "bg-background border-border-v text-foreground/50")}
                >
                  INFO
                </button>
                <button 
                  onClick={() => setCalloutType('warning')} 
                  className={cn("flex-1 h-7 rounded text-[10px] font-bold transition-all border", calloutType === 'warning' ? "bg-yellow-500/10 border-yellow-500 text-yellow-400" : "bg-background border-border-v text-foreground/50")}
                >
                  WARN
                </button>
                <button 
                  onClick={() => setCalloutType('error')} 
                  className={cn("flex-1 h-7 rounded text-[10px] font-bold transition-all border", calloutType === 'error' ? "bg-red-500/10 border-red-500 text-red-400" : "bg-background border-border-v text-foreground/50")}
                >
                  ALERT
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-v">
              <button 
                onClick={() => setShowCalloutModal(false)}
                className="h-7 px-3 text-[10px] text-foreground/60 hover:text-foreground transition-colors uppercase font-bold tracking-wider"
              >
                Cancel
              </button>
              <button 
                onClick={handleInsertCallout}
                className="h-7 px-3 bg-accent-blue hover:bg-blue-600 rounded text-white text-[10px] transition-colors uppercase font-bold tracking-wider"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Operational Layout Templates */}
      {showTemplateModal && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface border border-border-v rounded-md p-5 w-80 flex flex-col gap-4 shadow-2xl">
            <div className="font-bold text-xs uppercase tracking-wider text-foreground border-b border-border-v pb-2 flex items-center gap-1.5">
              <Sparkles size={14} className="text-accent-blue" />
              Load Report Template
            </div>
            
            <div className="text-[10.5px] text-foreground/40 leading-relaxed font-mono">
              Selecting a template will overwrite all active content. Save drafts beforehand!
            </div>
            
            <div className="flex flex-col gap-2 font-mono">
              <button 
                onClick={() => loadTemplate('bess')}
                className="h-10 text-left px-3 text-[11px] font-bold border border-border-v hover:border-accent-blue/30 rounded bg-background/50 hover:bg-accent-blue/5 text-foreground transition-colors flex items-center justify-between"
              >
                <span>BESS Operation Summary</span>
                <span className="text-[9px] text-foreground/40 uppercase">Recommended</span>
              </button>
              <button 
                onClick={() => loadTemplate('stability')}
                className="h-10 text-left px-3 text-[11px] font-bold border border-border-v hover:border-accent-blue/30 rounded bg-background/50 hover:bg-accent-blue/5 text-foreground transition-colors flex items-center justify-between"
              >
                <span>Grid Stability & Freq Audit</span>
                <span className="text-[9px] text-foreground/40 uppercase">Mitigations</span>
              </button>
              <button 
                onClick={() => loadTemplate('blank')}
                className="h-10 text-left px-3 text-[11px] font-bold border border-border-v hover:border-red-500/30 rounded bg-background/50 hover:bg-red-500/5 text-foreground transition-colors flex items-center justify-between"
              >
                <span>Blank Canvas Document</span>
                <span className="text-[9px] text-red-400 uppercase">Clear</span>
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-v">
              <button 
                onClick={() => setShowTemplateModal(false)}
                className="h-7 px-3 text-[10px] text-foreground/60 hover:text-foreground transition-colors uppercase font-bold tracking-wider"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Custom Tool Configuration */}
      {showToolModal && selectedTool && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface border border-border-v rounded-md p-5 w-96 flex flex-col gap-4 shadow-2xl max-h-[85%] overflow-hidden">
            <div className="font-bold text-xs uppercase tracking-wider text-foreground border-b border-border-v pb-2 flex items-center justify-between font-mono">
              <div className="flex items-center gap-1.5">
                <Code size={14} className="text-violet-400" />
                <span>Configure: {selectedTool.name}</span>
              </div>
              <button 
                onClick={() => { setShowToolModal(false); setSelectedTool(null); }}
                className="text-foreground/50 hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="text-[11px] text-foreground/60 leading-relaxed font-mono italic">
              {selectedTool.description}
            </div>
            
            <div className="flex-1 overflow-y-auto scrollbar-clean pr-1 flex flex-col gap-3 font-mono text-[11px]">
              {selectedTool.fields.map(field => {
                if (field.type === 'select') {
                  return (
                    <div key={field.id} className="flex flex-col gap-1">
                      <span className="text-foreground/50">{field.label}</span>
                      <select
                        value={toolInputs[field.id] !== undefined ? toolInputs[field.id] : ''}
                        onChange={(e) => setToolInputs(prev => ({ ...prev, [field.id]: e.target.value }))}
                        className="h-8 bg-background border border-border-v rounded px-2 text-foreground text-xs outline-none focus:border-violet-500 cursor-pointer"
                      >
                        {field.options?.map(opt => (
                          <option key={opt} value={opt} className="bg-surface text-foreground">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                } else if (field.type === 'number') {
                  return (
                    <div key={field.id} className="flex flex-col gap-1">
                      <span className="text-foreground/50">{field.label}</span>
                      <input
                        type="number"
                        value={toolInputs[field.id] !== undefined ? toolInputs[field.id] : ''}
                        onChange={(e) => setToolInputs(prev => ({ ...prev, [field.id]: e.target.value }))}
                        className="h-8 bg-background border border-border-v rounded px-2 text-foreground text-xs outline-none focus:border-violet-500"
                      />
                    </div>
                  );
                } else {
                  return (
                    <div key={field.id} className="flex flex-col gap-1">
                      <span className="text-foreground/50">{field.label}</span>
                      <input
                        type="text"
                        value={toolInputs[field.id] !== undefined ? toolInputs[field.id] : ''}
                        onChange={(e) => setToolInputs(prev => ({ ...prev, [field.id]: e.target.value }))}
                        className="h-8 bg-background border border-border-v rounded px-2 text-foreground text-xs outline-none focus:border-violet-500"
                      />
                    </div>
                  );
                }
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-v">
              <button 
                onClick={() => { setShowToolModal(false); setSelectedTool(null); }}
                className="h-7 px-3 text-[10px] text-foreground/60 hover:text-foreground transition-colors uppercase font-bold tracking-wider"
              >
                Cancel
              </button>
              <button 
                onClick={handleExecuteTool}
                className="h-7 px-3 bg-violet-600 hover:bg-violet-700 rounded text-white text-[10px] transition-colors uppercase font-bold tracking-wider"
              >
                Insert Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Customize Ribbon */}
      {showCustomizeRibbonModal && (
        <div className="absolute inset-0 bg-background/85 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface border border-border-v rounded-md p-6 w-[820px] h-[580px] flex flex-col gap-4 shadow-2xl overflow-hidden font-mono text-[11px]">
            {/* Header */}
            <div className="font-bold text-xs uppercase tracking-wider text-foreground border-b border-border-v pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings size={14} className="text-accent-blue" />
                <span>Customize Ribbon Options</span>
              </div>
              <button 
                onClick={() => setShowCustomizeRibbonModal(false)}
                className="text-foreground/50 hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Main Content Areas */}
            <div className="flex-1 flex gap-4 min-h-0">
              {/* Left Side: Choose commands from */}
              <div className="flex-1 flex flex-col gap-2 min-w-0">
                <span className="text-foreground/60 font-sans">Choose commands from:</span>
                <select
                  value={chooseCommandsFrom}
                  onChange={(e) => setChooseCommandsFrom(e.target.value)}
                  className="h-8 bg-background border border-border-v rounded px-2 text-foreground text-xs outline-none focus:border-accent-blue cursor-pointer"
                >
                  <option value="popular">Popular Commands</option>
                  <option value="all">All Commands</option>
                  <option value="tools">Custom Tools / Add-ins</option>
                </select>

                <div className="flex-1 border border-border-v bg-background rounded p-2 overflow-y-auto scrollbar-clean flex flex-col gap-0.5">
                  {getAvailableCommands()
                    .filter(c => {
                      if (chooseCommandsFrom === 'tools') return c.id.startsWith('tool_');
                      if (chooseCommandsFrom === 'popular') return !c.id.startsWith('tool_') || c.id === 'tool_signature_sign_off_default';
                      return true; // 'all'
                    })
                    .map(cmd => (
                      <button
                        key={cmd.id}
                        onClick={() => setSelectedAvailableCommandId(cmd.id)}
                        className={cn(
                          "w-full text-left px-2 py-1.5 rounded flex items-center gap-2 transition-colors",
                          selectedAvailableCommandId === cmd.id 
                            ? "bg-accent-blue/20 text-foreground border border-accent-blue/30" 
                            : "hover:bg-foreground/5 text-foreground/80 border border-transparent"
                        )}
                      >
                        {renderIcon(cmd.iconName, 13)}
                        <span className="truncate">{cmd.label}</span>
                      </button>
                    ))}
                </div>
              </div>

              {/* Center Controls: Add / Remove */}
              <div className="flex flex-col justify-center gap-3 px-1">
                <button
                  disabled={!selectedAvailableCommandId || !selectedTreeNode || selectedTreeNode.type !== 'group'}
                  onClick={handleAddCommand}
                  className="px-3 py-2 bg-slate-800 dark:bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-white border border-slate-700/60 rounded flex items-center gap-1 font-bold uppercase transition-all text-[10px]"
                  title="Add command to selected group"
                >
                  Add &gt;&gt;
                </button>
                <button
                  disabled={!selectedTreeNode}
                  onClick={handleRemoveNode}
                  className="px-3 py-2 bg-slate-800 dark:bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-white border border-slate-700/60 rounded flex items-center gap-1 font-bold uppercase transition-all text-[10px]"
                  title="Remove selected element"
                >
                  &lt;&lt; Remove
                </button>
              </div>

              {/* Right Side: Customize the Ribbon */}
              <div className="flex-1 flex flex-col gap-2 min-w-0">
                <span className="text-foreground/60 font-sans">Customize the Ribbon:</span>
                <select
                  value="main"
                  disabled
                  className="h-8 bg-background border border-border-v rounded px-2 text-foreground text-xs outline-none focus:border-accent-blue cursor-pointer"
                >
                  <option value="main">Main Tabs</option>
                </select>

                <div className="flex-1 border border-border-v bg-background rounded p-2 overflow-y-auto scrollbar-clean flex flex-col gap-1">
                  {tempRibbonLayout.map(tab => {
                    const isTabExpanded = expandedNodes[`tab_${tab.id}`] ?? false;
                    const isTabSelected = selectedTreeNode?.type === 'tab' && selectedTreeNode.tabId === tab.id;
                    
                    return (
                      <div key={tab.id} className="flex flex-col gap-0.5">
                        {/* Tab Row */}
                        <div className={cn(
                          "flex items-center justify-between p-1 rounded group/row transition-colors",
                          isTabSelected ? "bg-slate-800 dark:bg-slate-800 text-white font-bold" : "hover:bg-foreground/5 text-foreground/80"
                        )}>
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            <button
                              onClick={() => setExpandedNodes(prev => ({ ...prev, [`tab_${tab.id}`]: !isTabExpanded }))}
                              className="p-0.5 text-foreground/45 hover:text-foreground"
                            >
                              {isTabExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </button>
                            <input
                              type="checkbox"
                              checked={tab.visible}
                              onChange={() => handleToggleNodeVisibility(tab.id)}
                              className="mr-1 h-3.5 w-3.5 border-border-v rounded text-accent-blue cursor-pointer bg-background focus:ring-0"
                            />
                            <Folder size={12} className="text-amber-500 shrink-0" />
                            <span 
                              onClick={() => setSelectedTreeNode({ type: 'tab', tabId: tab.id })}
                              className="cursor-pointer truncate flex-1 pr-2 ml-1"
                            >
                              {tab.label}
                            </span>
                          </div>
                        </div>

                        {/* Groups (if expanded) */}
                        {isTabExpanded && tab.groups.map(group => {
                          const isGroupExpanded = expandedNodes[`group_${group.id}`] ?? false;
                          const isGroupSelected = selectedTreeNode?.type === 'group' && selectedTreeNode.groupId === group.id;
                          
                          return (
                            <div key={group.id} className="pl-4 flex flex-col gap-0.5">
                              {/* Group Row */}
                              <div className={cn(
                                "flex items-center justify-between p-1 rounded transition-colors",
                                isGroupSelected ? "bg-slate-800 dark:bg-slate-800 text-white font-bold" : "hover:bg-foreground/5 text-foreground/75"
                              )}>
                                <div className="flex items-center gap-1 min-w-0 flex-1 pl-2">
                                  <button
                                    onClick={() => setExpandedNodes(prev => ({ ...prev, [`group_${group.id}`]: !isGroupExpanded }))}
                                    className="p-0.5 text-foreground/45 hover:text-foreground"
                                  >
                                    {isGroupExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                  </button>
                                  <input
                                    type="checkbox"
                                    checked={group.visible}
                                    onChange={() => handleToggleNodeVisibility(tab.id, group.id)}
                                    className="mr-1 h-3 w-3 border-border-v rounded text-accent-blue cursor-pointer bg-background focus:ring-0"
                                  />
                                  <span 
                                    onClick={() => setSelectedTreeNode({ type: 'group', tabId: tab.id, groupId: group.id })}
                                    className="cursor-pointer truncate flex-1 pr-2 italic font-semibold text-slate-300 dark:text-slate-300 text-[10px] ml-1"
                                  >
                                    {group.label}
                                  </span>
                                </div>
                              </div>

                              {/* Commands (if expanded) */}
                              {isGroupExpanded && group.commands.map(cmd => {
                                const isCmdSelected = selectedTreeNode?.type === 'command' && selectedTreeNode.commandId === cmd.id && selectedTreeNode.groupId === group.id;
                                
                                return (
                                  <div 
                                    key={cmd.id} 
                                    onClick={() => setSelectedTreeNode({ type: 'command', tabId: tab.id, groupId: group.id, commandId: cmd.id })}
                                    className={cn(
                                      "pl-12 pr-2 py-1 rounded flex items-center gap-2 cursor-pointer transition-colors text-[10px]",
                                      isCmdSelected ? "bg-slate-900 dark:bg-slate-900 text-white font-bold" : "hover:bg-foreground/5 text-foreground/60"
                                    )}
                                  >
                                    {renderIcon(cmd.iconName, 12)}
                                    <span className="truncate">{cmd.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Configuration Modification Panel */}
            <div className="flex items-center justify-between border-t border-border-v pt-3 font-sans">
              <div className="flex gap-2">
                <button
                  onClick={handleCreateNewTab}
                  className="h-8 px-3 border border-border-v bg-background hover:bg-foreground/5 text-foreground rounded text-[10px] font-bold uppercase transition-all"
                >
                  New Tab
                </button>
                <button
                  disabled={!selectedTreeNode}
                  onClick={handleCreateNewGroup}
                  className="h-8 px-3 border border-border-v bg-background hover:bg-foreground/5 text-foreground rounded text-[10px] font-bold uppercase transition-all disabled:opacity-30 disabled:hover:bg-background"
                >
                  New Group
                </button>
                <button
                  disabled={!selectedTreeNode || selectedTreeNode.type === 'command'}
                  onClick={handleRenameNode}
                  className="h-8 px-3 border border-border-v bg-background hover:bg-foreground/5 text-foreground rounded text-[10px] font-bold uppercase transition-all disabled:opacity-30 disabled:hover:bg-background"
                >
                  Rename...
                </button>
              </div>

              <div className="flex items-center gap-2 relative">
                {/* Reset dropdown toggle */}
                <div className="relative">
                  <button
                    onClick={() => { setShowResetDropdown(!showResetDropdown); setShowImportExportDropdown(false); }}
                    className="h-8 px-3 border border-border-v bg-background hover:bg-foreground/5 text-foreground rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1"
                  >
                    Reset <ChevronDown size={11} />
                  </button>
                  {showResetDropdown && (
                    <div className="absolute bottom-10 right-0 w-44 bg-surface border border-border-v rounded shadow-2xl py-1 flex flex-col z-50 text-[10.5px]">
                      <button
                        onClick={() => handleResetRibbonConfig('selected')}
                        disabled={!selectedTreeNode}
                        className="w-full text-left px-3 py-2 hover:bg-foreground/5 text-foreground disabled:opacity-30"
                      >
                        Reset only selected tab
                      </button>
                      <button
                        onClick={() => handleResetRibbonConfig('all')}
                        className="w-full text-left px-3 py-2 hover:bg-foreground/5 text-foreground border-t border-border-v"
                      >
                        Reset all customizations
                      </button>
                    </div>
                  )}
                </div>

                {/* Import/Export dropdown toggle */}
                <div className="relative">
                  <button
                    onClick={() => { setShowImportExportDropdown(!showImportExportDropdown); setShowResetDropdown(false); }}
                    className="h-8 px-3 border border-border-v bg-background hover:bg-foreground/5 text-foreground rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1"
                  >
                    Import/Export <ChevronDown size={11} />
                  </button>
                  {showImportExportDropdown && (
                    <div className="absolute bottom-10 right-0 w-40 bg-surface border border-border-v rounded shadow-2xl py-1 flex flex-col z-50 text-[10px]">
                      <button
                        onClick={() => ribbonConfigFileInputRef.current?.click()}
                        className="w-full text-left px-3 py-2 hover:bg-foreground/5 text-foreground"
                      >
                        Import customization
                      </button>
                      <button
                        onClick={handleExportRibbonConfig}
                        className="w-full text-left px-3 py-2 hover:bg-foreground/5 text-foreground border-t border-border-v"
                      >
                        Export customization
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={ribbonConfigFileInputRef}
                    className="hidden"
                    accept=".json"
                    onChange={handleImportRibbonConfig}
                  />
                </div>
              </div>
            </div>

            {/* Footer OK/Cancel buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-border-v font-sans">
              <button 
                onClick={() => setShowCustomizeRibbonModal(false)}
                className="h-8 px-4 text-[10px] text-foreground/60 hover:text-foreground uppercase font-bold tracking-wider hover:bg-foreground/5 rounded transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveRibbonCustomizer}
                className="h-8 px-4 bg-accent-blue hover:bg-blue-600 rounded text-white text-[10px] transition-all uppercase font-bold tracking-wider"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Import Tool Destination Selector */}
      {showImportTargetModal && pendingImportTool && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface border border-border-v rounded-md p-5 w-[420px] flex flex-col gap-4 shadow-2xl font-mono text-[11px]">
            <div className="font-bold text-xs uppercase tracking-wider text-foreground border-b border-border-v pb-2 flex items-center gap-1.5">
              <Upload size={14} className="text-violet-400" />
              <span>Import Custom Tool: {pendingImportTool.tool.name}</span>
            </div>

            <div className="text-[10px] text-foreground/50 leading-relaxed italic">
              {pendingImportTool.tool.description}
            </div>

            <div className="flex flex-col gap-3 font-sans text-xs">
              {/* Tab Selector */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-bold text-foreground/60 font-mono">Target Tab</span>
                <select
                  value={importTargetTabId}
                  onChange={(e) => {
                    setImportTargetTabId(e.target.value);
                    const tab = ribbonLayout.find(t => t.id === e.target.value);
                    if (tab && tab.groups.length > 0) {
                      setImportTargetGroupId(tab.groups[0].id);
                    } else {
                      setImportTargetGroupId('create_new_group');
                    }
                  }}
                  className="h-8 bg-background border border-border-v rounded px-2 text-foreground outline-none focus:border-violet-500 cursor-pointer font-mono"
                >
                  {ribbonLayout.map(tab => (
                    <option key={tab.id} value={tab.id}>
                      {tab.label} (Tab ID: {tab.id})
                    </option>
                  ))}
                  <option value="create_new_tab" className="text-violet-400 font-bold">
                    + [Create New Tab...]
                  </option>
                </select>
              </div>

              {/* If "Create New Tab" is selected */}
              {importTargetTabId === 'create_new_tab' && (
                <div className="flex flex-col gap-1.5 pl-3 border-l-2 border-violet-500">
                  <span className="text-[10px] uppercase font-bold text-foreground/60 font-mono">New Tab Name</span>
                  <input
                    type="text"
                    placeholder="E.g., Custom Analytics"
                    value={newTabName}
                    onChange={(e) => setNewTabName(e.target.value)}
                    className="h-8 bg-background border border-border-v rounded px-2 text-foreground outline-none focus:border-violet-500 font-mono"
                  />
                </div>
              )}

              {/* Group Selector */}
              {importTargetTabId !== 'create_new_tab' && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-foreground/60 font-mono">Target Group</span>
                  <select
                    value={importTargetGroupId}
                    onChange={(e) => setImportTargetGroupId(e.target.value)}
                    className="h-8 bg-background border border-border-v rounded px-2 text-foreground outline-none focus:border-violet-500 cursor-pointer font-mono"
                  >
                    {ribbonLayout.find(t => t.id === importTargetTabId)?.groups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.label}
                      </option>
                    ))}
                    <option value="create_new_group" className="text-violet-400 font-bold">
                      + [Create New Group...]
                    </option>
                  </select>
                </div>
              )}

              {/* If "Create New Group" is selected */}
              {(importTargetGroupId === 'create_new_group' || importTargetTabId === 'create_new_tab') && (
                <div className="flex flex-col gap-1.5 pl-3 border-l-2 border-violet-500">
                  <span className="text-[10px] uppercase font-bold text-foreground/60 font-mono">New Group Name</span>
                  <input
                    type="text"
                    placeholder="E.g., Diagnostics"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="h-8 bg-background border border-border-v rounded px-2 text-foreground outline-none focus:border-violet-500 font-mono"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border-v font-sans">
              <button 
                onClick={() => {
                  setPendingImportTool(null);
                  setShowImportTargetModal(false);
                }}
                className="h-7 px-3 text-[10px] text-foreground/60 hover:text-foreground uppercase font-bold tracking-wider rounded transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmImport}
                className="h-7 px-4 bg-violet-600 hover:bg-violet-700 rounded text-white text-[10px] transition-all uppercase font-bold tracking-wider"
              >
                Confirm Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
