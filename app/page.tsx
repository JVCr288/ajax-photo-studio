"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Grid2X2,
  Folder,
  Sparkles,
  Users,
  Clock3,
  Settings,
  Command,
  Save,
  WandSparkles,
  Upload,
  ImageIcon,
  Shirt,
  Map,
  Package,
  ChevronRight,
  Plus,
  Trash2,
  RotateCcw,
  X
} from "lucide-react";

type Blueprint = {
  id: string;
  name: string;
  description: string;
};

type ReferenceMap = Record<string, string>;

type Project = {
  id: string;
  name: string;
  idea: string;
  blueprintId: string;
  references: ReferenceMap;
  score: number;
  updatedAt: string;
};

type Version = Project & {
  versionId: string;
};

type Generation = {
  id: string;
  projectName: string;
  blueprintName: string;
  createdAt: string;
};

const blueprints: Blueprint[] = [
  { id: "luxury", name: "Luxury Editorial", description: "85mm · soft key light · premium finish" },
  { id: "cinematic", name: "Cinematic Romance", description: "50mm · golden hour · filmic contrast" },
  { id: "natural", name: "Natural Portrait", description: "85mm · window light · true skin tones" }
];

const quickIdeas = [
  "Luxury wedding",
  "Editorial portrait",
  "Fashion campaign",
  "Cinematic poster",
  "Product studio"
];

const referenceTypes = [
  { id: "human", label: "Human", hint: "Face or person reference", icon: ImageIcon },
  { id: "outfit", label: "Outfit", hint: "Clothing and styling", icon: Shirt },
  { id: "scene", label: "Scene", hint: "Location or backdrop", icon: Map },
  { id: "object", label: "Object", hint: "Product or key detail", icon: Package }
];

const storageKeys = {
  projects: "ajax-click-v7-projects",
  history: "ajax-click-v7-history",
  generations: "ajax-click-v7-generations"
};

export default function HomePage() {
  const [view, setView] = useState<"create" | "projects">("create");
  const [idea, setIdea] = useState("");
  const [activeBlueprint, setActiveBlueprint] = useState("luxury");
  const [score, setScore] = useState(92);
  const [status, setStatus] = useState("Generate Image");
  const [projectName, setProjectName] = useState("Untitled Creative Project");
  const [references, setReferences] = useState<ReferenceMap>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [history, setHistory] = useState<Version[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    setProjects(readStorage<Project[]>(storageKeys.projects, []));
    setHistory(readStorage<Version[]>(storageKeys.history, []));
    setGenerations(readStorage<Generation[]>(storageKeys.generations, []));
  }, []);

  const selectedBlueprint = useMemo(
    () => blueprints.find((item) => item.id === activeBlueprint) ?? blueprints[0],
    [activeBlueprint]
  );

  const referenceStrength = Math.min(100, 68 + Object.keys(references).length * 8);

  function directIdea() {
    if (!idea.trim()) {
      setIdea("Luxury editorial portrait with elegant styling and cinematic natural light");
    }
    setScore(96);
    setStatus("Directed");
    window.setTimeout(() => setStatus("Generate Image"), 1200);
  }

  function improveEverything() {
    setStatus("Improving...");
    window.setTimeout(() => {
      setScore(99);
      setStatus("Improved");
      window.setTimeout(() => setStatus("Generate Image"), 1200);
    }, 700);
  }

  function handleReferenceUpload(type: string, file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setReferences((current) => ({
        ...current,
        [type]: String(reader.result)
      }));
      setScore((current) => Math.min(99, current + 1));
    };
    reader.readAsDataURL(file);
  }

  function removeReference(type: string) {
    setReferences((current) => {
      const next = { ...current };
      delete next[type];
      return next;
    });
  }

  function currentProject(): Project {
    return {
      id: crypto.randomUUID(),
      name: projectName.trim() || "Untitled Creative Project",
      idea,
      blueprintId: activeBlueprint,
      references,
      score,
      updatedAt: new Date().toISOString()
    };
  }

  function saveProject() {
    const project = currentProject();
    const existing = projects.findIndex((item) => item.name === project.name);
    const nextProjects =
      existing >= 0
        ? projects.map((item, index) => (index === existing ? { ...project, id: item.id } : item))
        : [project, ...projects];

    const version: Version = {
      ...project,
      versionId: crypto.randomUUID()
    };

    const nextHistory = [version, ...history].slice(0, 50);

    setProjects(nextProjects);
    setHistory(nextHistory);
    writeStorage(storageKeys.projects, nextProjects);
    writeStorage(storageKeys.history, nextHistory);

    setStatus("Saved");
    window.setTimeout(() => setStatus("Generate Image"), 1200);
  }

  function loadProject(project: Project) {
    setProjectName(project.name);
    setIdea(project.idea);
    setActiveBlueprint(project.blueprintId);
    setReferences(project.references ?? {});
    setScore(project.score);
    setView("create");
  }

  function deleteProject(id: string) {
    const next = projects.filter((item) => item.id !== id);
    setProjects(next);
    writeStorage(storageKeys.projects, next);
  }

  function resetProject() {
    setProjectName("Untitled Creative Project");
    setIdea("");
    setActiveBlueprint("luxury");
    setReferences({});
    setScore(92);
    setView("create");
  }

  function restoreVersion(version: Version) {
    loadProject(version);
    setHistoryOpen(false);
  }

  function generateImage() {
    setStatus("Generating...");
    window.setTimeout(() => {
      const generation: Generation = {
        id: crypto.randomUUID(),
        projectName: projectName.trim() || "Untitled Creative Project",
        blueprintName: selectedBlueprint.name,
        createdAt: new Date().toISOString()
      };
      const next = [generation, ...generations];
      setGenerations(next);
      writeStorage(storageKeys.generations, next);
      setStatus("Generated");
      window.setTimeout(() => setStatus("Generate Image"), 1200);
    }, 1200);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <strong>AJAX CLICK</strong>
            <span>Creative Workspace</span>
          </div>
        </div>

        <p className="nav-label">Workspace</p>
        <nav className="nav-list">
          <button className={view === "create" ? "active" : ""} onClick={() => setView("create")}>
            <Grid2X2 size={17} /> Create
          </button>
          <button className={view === "projects" ? "active" : ""} onClick={() => setView("projects")}>
            <Folder size={17} /> Projects
          </button>
          <button><Sparkles size={17} /> Blueprints</button>
          <button><Users size={17} /> Community</button>
          <button onClick={() => setHistoryOpen(true)}><Clock3 size={17} /> History</button>
        </nav>

        <p className="nav-label">System</p>
        <nav className="nav-list">
          <button><Command size={17} /> Command Menu</button>
          <button><Settings size={17} /> Settings</button>
        </nav>

        <div className="credits">
          <div className="credits-row"><span>Credits</span><strong>1,280</strong></div>
          <div className="credit-bar"><span /></div>
          <button>Upgrade plan</button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="project-title">
            <span className="live-dot" />
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              aria-label="Project name"
            />
          </div>
          <div className="top-actions">
            <button className="ghost" onClick={saveProject}><Save size={15} /> Save</button>
            <button className="icon-button"><Command size={16} /></button>
            <button className="icon-button"><Sparkles size={16} /></button>
          </div>
        </header>

        <div className="workspace-scroll">
          {view === "projects" ? (
            <ProjectsView
              projects={projects}
              generations={generations}
              onCreate={resetProject}
              onOpen={loadProject}
              onDelete={deleteProject}
            />
          ) : (
            <div className="workspace">
              <section className="hero">
                <span className="eyebrow">AI Creative Director</span>
                <h1>What do you want to create?</h1>
                <p>
                  Describe the result. AJAX CLICK handles the visual direction,
                  camera, lighting and prompt structure.
                </p>

                <div className="idea-composer">
                  <textarea
                    value={idea}
                    onChange={(event) => setIdea(event.target.value)}
                    placeholder="Example: A luxury wedding portrait in a tropical garden at golden hour..."
                  />
                  <button className="primary" onClick={directIdea}>
                    Direct my idea <WandSparkles size={16} />
                  </button>
                </div>

                <div className="chips">
                  {quickIdeas.map((item) => (
                    <button key={item} onClick={() => setIdea(`${item} with premium professional photography`)}>
                      {item}
                    </button>
                  ))}
                </div>
              </section>

              <SectionHeader title="References" description="Add only what the AI should follow." action="Open library" />
              <div className="reference-grid">
                {referenceTypes.map(({ id, label, hint, icon: Icon }) => {
                  const preview = references[id];
                  return (
                    <label className={preview ? "reference-card has-preview" : "reference-card"} key={id}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleReferenceUpload(id, event.target.files?.[0])}
                      />
                      {preview ? (
                        <>
                          <img src={preview} alt={`${label} reference`} />
                          <div className="reference-overlay">
                            <strong>{label} reference</strong>
                            <small>Click image to replace</small>
                          </div>
                          <button
                            type="button"
                            className="remove-reference"
                            onClick={(event) => {
                              event.preventDefault();
                              removeReference(id);
                            }}
                            aria-label={`Remove ${label} reference`}
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="reference-icon"><Icon size={18} /></span>
                          <strong>{label}</strong>
                          <small>{hint}</small>
                          <span className="upload-line"><Upload size={13} /> Upload reference</span>
                        </>
                      )}
                    </label>
                  );
                })}
              </div>

              <SectionHeader title="Creative Blueprint" description="A professional visual setup in one click." action="Browse all" />
              <div className="blueprint-grid">
                {blueprints.map((blueprint) => (
                  <button
                    key={blueprint.id}
                    className={activeBlueprint === blueprint.id ? "blueprint-card active" : "blueprint-card"}
                    onClick={() => setActiveBlueprint(blueprint.id)}
                  >
                    <span className="blueprint-visual" />
                    <strong>{blueprint.name}</strong>
                    <small>{blueprint.description}</small>
                  </button>
                ))}
              </div>

              <SectionHeader
                title="Composition Preview"
                description="Review visual direction before spending generation credits."
                action="Refresh preview"
              />
              <div className="composition-preview">
                <div className="preview-light" />
                <div className="subject-silhouette"><span className="head" /><span className="body" /></div>
                <span className="ready-badge">Ready to generate</span>
                <div className="preview-tags">
                  <span>Portrait subject</span><span>{selectedBlueprint.name}</span><span>85mm lens</span><span>4:5</span>
                </div>
              </div>

              <SectionHeader
                title="Generated Gallery"
                description="Local visual generations created in this browser."
                action={`${generations.length} items`}
              />
              <div className="generation-grid">
                {generations.length ? (
                  generations.map((generation, index) => (
                    <article className="generation-card" key={generation.id}>
                      <div className="generation-art" style={{ filter: `hue-rotate(${index * 18}deg)` }} />
                      <div>
                        <strong>{generation.projectName}</strong>
                        <small>{generation.blueprintName} · {new Date(generation.createdAt).toLocaleString()}</small>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">Generate an image to create your first gallery variation.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <aside className="inspector">
        <div className="inspector-header"><strong>AI Director</strong><span>● Live</span></div>
        <div className="inspector-content">
          <div className="score-card">
            <div className="score-heading">
              <div><span>Creative Quality</span><strong>{score}%</strong></div>
              <div className="score-ring" style={{ background: `conic-gradient(var(--cyan) 0 ${score}%, #273140 ${score}% 100%)` }}>
                <span>{score}</span>
              </div>
            </div>

            <Metric label="Idea clarity" value={idea.trim() ? 96 : 82} />
            <Metric label="Visual direction" value={97} />
            <Metric label="Reference strength" value={referenceStrength} />

            <button className="improve-button" onClick={improveEverything}>
              <Sparkles size={15} /> Improve everything
            </button>
          </div>

          <InspectorPanel title="AI Suggestions" open>
            <Suggestion text="Add a face reference" />
            <Suggestion text="Use warm rim lighting" />
            <Suggestion text="Strengthen background depth" />
          </InspectorPanel>

          <InspectorPanel title="Creative Setup" open>
            <Setting label="Blueprint" value={selectedBlueprint.name} />
            <Setting label="Camera" value="85mm Portrait" />
            <Setting label="Lighting" value="Soft Key" />
            <Setting label="Composition" value="Medium Shot" />
            <Setting label="Output" value="4:5 · High" />
          </InspectorPanel>

          <InspectorPanel title="Generated Prompt">
            <div className="prompt-preview">
              Professional {selectedBlueprint.name.toLowerCase()} portrait,
              refined contemporary styling, soft key lighting, 85mm portrait
              lens, medium shot, natural skin texture, premium color grading,
              high dynamic range, photorealistic finish.
            </div>
          </InspectorPanel>
        </div>
      </aside>

      <footer className="bottom-toolbar">
        <button className="ghost">Compare</button>
        <button className="ghost" onClick={() => setHistoryOpen(true)}>History</button>
        <button className="ghost">Generate Prompt</button>
        <button className="primary" onClick={generateImage}>{status} <Sparkles size={15} /></button>
        <button className="ghost">Export</button>
      </footer>

      {historyOpen && (
        <div className="modal-backdrop" onClick={() => setHistoryOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-heading">
              <div><span className="eyebrow">Project timeline</span><h2>Version History</h2></div>
              <button className="icon-button" onClick={() => setHistoryOpen(false)}><X size={16} /></button>
            </div>
            <div className="history-list">
              {history.length ? history.map((version, index) => (
                <div className="history-item" key={version.versionId}>
                  <div>
                    <strong>Version {history.length - index} · {version.name}</strong>
                    <small>{new Date(version.updatedAt).toLocaleString()} · {blueprints.find((item) => item.id === version.blueprintId)?.name}</small>
                  </div>
                  <button className="ghost" onClick={() => restoreVersion(version)}><RotateCcw size={13} /> Restore</button>
                </div>
              )) : <div className="empty-state">Save the project to create a version.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectsView({
  projects,
  generations,
  onCreate,
  onOpen,
  onDelete
}: {
  projects: Project[];
  generations: Generation[];
  onCreate: () => void;
  onOpen: (project: Project) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="projects-view">
      <div className="projects-hero">
        <div><span className="eyebrow">Creative Workspace</span><h1>Your projects</h1><p>Continue an existing visual direction or start a new one.</p></div>
        <button className="primary" onClick={onCreate}><Plus size={16} /> New Creative Project</button>
      </div>

      <div className="stats-grid">
        <Stat label="PROJECTS" value={projects.length} />
        <Stat label="GENERATIONS" value={generations.length} />
        <Stat label="BLUEPRINTS" value={blueprints.length} />
        <Stat label="CREDITS" value="1,280" />
      </div>

      <SectionHeader title="Recent Projects" description="Projects are stored locally in this browser." action={`${projects.length} projects`} />
      <div className="projects-grid">
        {projects.length ? projects.map((project) => (
          <article className="project-card" key={project.id}>
            <button className="project-open" onClick={() => onOpen(project)}>
              <span className="project-art" />
              <span className="project-meta">
                <strong>{project.name}</strong>
                <small>{blueprints.find((item) => item.id === project.blueprintId)?.name} · {new Date(project.updatedAt).toLocaleDateString()}</small>
              </span>
            </button>
            <button className="project-delete" onClick={() => onDelete(project.id)} aria-label="Delete project"><Trash2 size={14} /></button>
          </article>
        )) : <div className="empty-state">No saved projects yet. Create and save your first project.</div>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div>;
}

function SectionHeader({ title, description, action }: { title: string; description: string; action: string }) {
  return (
    <div className="section-header">
      <div><h2>{title}</h2><p>{description}</p></div>
      <button>{action}</button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric">
      <div><span>{label}</span><strong>{value}</strong></div>
      <div className="metric-track"><span style={{ width: `${value}%` }} /></div>
    </div>
  );
}

function InspectorPanel({ title, open = false, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details className="inspector-panel" open={open}>
      <summary>{title}<ChevronRight size={15} /></summary>
      <div className="panel-body">{children}</div>
    </details>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return <div className="setting-row"><span>{label}</span><button>{value}</button></div>;
}

function Suggestion({ text }: { text: string }) {
  return <div className="suggestion-row"><span>{text}</span><button>Apply</button></div>;
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}
