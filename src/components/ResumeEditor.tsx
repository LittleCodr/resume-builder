import React, { useState, useEffect } from 'react';
import { Download, Wand2, Plus, Trash2, RefreshCw } from 'lucide-react';
import { Resume, WorkExperience, Education, Project } from '../types/resume';
import { generateJobDescription, generateSummary, analyzeResume } from '../lib/gemini';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Initialize pdfMake with fonts
(pdfMake as any).vfs = pdfFonts && pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : globalThis.pdfMake.vfs;

const initialResume: Resume = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: ''
  },
  summary: '',
  workExperience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: []
};

const templates = {
  modern: {
    name: 'Modern',
    primaryColor: 'blue',
    fontFamily: 'Inter',
    spacing: 'comfortable'
  },
  classic: {
    name: 'Classic',
    primaryColor: 'gray',
    fontFamily: 'Georgia',
    spacing: 'compact'
  },
  minimal: {
    name: 'Minimal',
    primaryColor: 'slate',
    fontFamily: 'system-ui',
    spacing: 'relaxed'
  }
};

export default function ResumeEditor() {
  const [resume, setResume] = useState<Resume>(() => {
    const saved = localStorage.getItem('resume');
    return saved ? JSON.parse(saved) : initialResume;
  });
  const [activeSection, setActiveSection] = useState('personal');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    localStorage.setItem('resume', JSON.stringify(resume));
  }, [resume]);

  const handlePersonalInfoChange = (field: keyof typeof resume.personalInfo, value: string) => {
    setResume(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  const handleAddWorkExperience = () => {
    const newExp: WorkExperience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      description: []
    };
    setResume(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, newExp]
    }));
  };

  const handleWorkExperienceChange = (id: string, field: keyof WorkExperience, value: any) => {
    setResume(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const handleGenerateJobDescription = async (id: string, position: string) => {
    setIsGenerating(true);
    try {
      const description = await generateJobDescription(position, '');
      setResume(prev => ({
        ...prev,
        workExperience: prev.workExperience.map(exp =>
          exp.id === id ? { ...exp, description: description.split('\n').filter(Boolean) } : exp
        )
      }));
    } catch (error) {
      console.error('Error generating job description:', error);
    }
    setIsGenerating(false);
  };

  const handleAddEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      school: '',
      degree: '',
      field: '',
      graduationDate: '',
      achievements: []
    };
    setResume(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }));
  };

  const handleEducationChange = (id: string, field: keyof Education, value: any) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const handleSkillsChange = (skills: string[]) => {
    setResume(prev => ({ ...prev, skills }));
  };

  const handleAddProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: '',
      description: '',
      technologies: [],
      githubUrl: '',
      liveUrl: ''
    };
    setResume(prev => ({
      ...prev,
      projects: [...prev.projects, newProject]
    }));
  };

  const handleProjectChange = (id: string, field: keyof Project, value: any) => {
    setResume(prev => ({
      ...prev,
      projects: prev.projects.map(proj =>
        proj.id === id ? { ...proj, [field]: value } : proj
      )
    }));
  };

  const handleGenerateAISummary = async () => {
    const experience = resume.workExperience.map(exp => 
      `${exp.position} at ${exp.company}`
    ).join(', ');
    
    try {
      const summary = await generateSummary(experience, resume.skills);
      setResume(prev => ({ ...prev, summary }));
    } catch (error) {
      console.error('Error generating summary:', error);
    }
  };

  const handleAnalyzeResume = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeResume(JSON.stringify(resume));
      setFeedback(analysis);
    } catch (error) {
      console.error('Error analyzing resume:', error);
    }
    setIsAnalyzing(false);
  };

  const generatePDF = () => {
    const template = templates[selectedTemplate as keyof typeof templates];
    
    const docDefinition = {
      content: [
        { text: resume.personalInfo.fullName, style: 'header' },
        { text: [
          resume.personalInfo.email,
          resume.personalInfo.phone,
          resume.personalInfo.location
        ].filter(Boolean).join(' | '), style: 'subheader' },
        
        resume.summary && [
          { text: 'Professional Summary', style: 'sectionHeader' },
          { text: resume.summary, margin: [0, 0, 0, 10] }
        ],
        
        resume.workExperience.length > 0 && [
          { text: 'Work Experience', style: 'sectionHeader' },
          ...resume.workExperience.map(exp => ([
            { text: exp.position, style: 'jobTitle' },
            { text: `${exp.company} | ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`, style: 'date' },
            { ul: exp.description }
          ])).flat()
        ],
        
        resume.education.length > 0 && [
          { text: 'Education', style: 'sectionHeader' },
          ...resume.education.map(edu => ([
            { text: `${edu.degree} in ${edu.field}`, style: 'jobTitle' },
            { text: `${edu.school} | ${edu.graduationDate}`, style: 'date' },
            edu.achievements.length > 0 && { ul: edu.achievements }
          ])).flat()
        ],
        
        resume.skills.length > 0 && [
          { text: 'Skills', style: 'sectionHeader' },
          { text: resume.skills.join(', '), margin: [0, 0, 0, 10] }
        ],
        
        resume.projects.length > 0 && [
          { text: 'Projects', style: 'sectionHeader' },
          ...resume.projects.map(project => ([
            { text: project.title, style: 'jobTitle' },
            { text: project.description },
            { text: `Technologies: ${project.technologies.join(', ')}`, style: 'technologies' },
            project.githubUrl && { text: `GitHub: ${project.githubUrl}`, style: 'link' },
            project.liveUrl && { text: `Live Demo: ${project.liveUrl}`, style: 'link' }
          ])).flat()
        ]
      ].filter(Boolean),
      styles: {
        header: {
          fontSize: 24,
          bold: true,
          color: template.primaryColor === 'blue' ? '#2563eb' : '#374151',
          margin: [0, 0, 0, 10]
        },
        subheader: {
          fontSize: 12,
          color: '#6b7280',
          margin: [0, 0, 0, 20]
        },
        sectionHeader: {
          fontSize: 16,
          bold: true,
          color: template.primaryColor === 'blue' ? '#1d4ed8' : '#1f2937',
          margin: [0, 15, 0, 10]
        },
        jobTitle: {
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 5]
        },
        date: {
          fontSize: 12,
          italic: true,
          color: '#6b7280',
          margin: [0, 0, 0, 5]
        },
        technologies: {
          fontSize: 12,
          color: '#4b5563',
          margin: [0, 5, 0, 5]
        },
        link: {
          fontSize: 12,
          color: '#2563eb',
          decoration: 'underline',
          margin: [0, 2, 0, 2]
        }
      },
      defaultStyle: {
        font: template.fontFamily === 'Georgia' ? 'Times' : 'Helvetica'
      },
      pageMargins: template.spacing === 'comfortable' ? [40, 40, 40, 40] : [30, 30, 30, 30]
    };

    pdfMake.createPdf(docDefinition).download('resume.pdf');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Resume Builder</h1>
          <div className="flex gap-4">
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              {Object.entries(templates).map(([key, template]) => (
                <option key={key} value={key}>{template.name}</option>
              ))}
            </select>
            <button
              onClick={handleAnalyzeResume}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={isAnalyzing}
            >
              <RefreshCw className="w-5 h-5" />
              {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
            </button>
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-5 h-5" />
              Export PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Editor Panel */}
          <div className="col-span-4 bg-white rounded-lg shadow p-6">
            <div className="space-y-6">
              {/* Navigation */}
              <nav className="space-y-2">
                {['personal', 'summary', 'experience', 'education', 'skills', 'projects'].map(section => (
                  <button
                    key={section}
                    onClick={() => setActiveSection(section)}
                    className={`w-full text-left px-4 py-2 rounded-lg ${
                      activeSection === section
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </button>
                ))}
              </nav>

              {/* Section Content */}
              <div className="border-t pt-6">
                {activeSection === 'personal' && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={resume.personalInfo.fullName}
                      onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={resume.personalInfo.email}
                      onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={resume.personalInfo.phone}
                      onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={resume.personalInfo.location}
                      onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="url"
                      placeholder="LinkedIn URL"
                      value={resume.personalInfo.linkedin}
                      onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="url"
                      placeholder="GitHub URL"
                      value={resume.personalInfo.github}
                      onChange={(e) => handlePersonalInfoChange('github', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="url"
                      placeholder="Portfolio URL"
                      value={resume.personalInfo.portfolio}
                      onChange={(e) => handlePersonalInfoChange('portfolio', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                )}

                {activeSection === 'summary' && (
                  <div className="space-y-4">
                    <textarea
                      placeholder="Professional Summary"
                      value={resume.summary}
                      onChange={(e) => setResume(prev => ({ ...prev, summary: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg h-40"
                    />
                    <button
                      onClick={handleGenerateAISummary}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      <Wand2 className="w-5 h-5" />
                      Generate AI Summary
                    </button>
                  </div>
                )}

                {activeSection === 'experience' && (
                  <div className="space-y-6">
                    {resume.workExperience.map((exp, index) => (
                      <div key={exp.id} className="space-y-4 border-b pb-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">Experience {index + 1}</h3>
                          <button
                            onClick={() => setResume(prev => ({
                              ...prev,
                              workExperience: prev.workExperience.filter(e => e.id !== exp.id)
                            }))}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Company"
                          value={exp.company}
                          onChange={(e) => handleWorkExperienceChange(exp.id, 'company', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="Position"
                          value={exp.position}
                          onChange={(e) => handleWorkExperienceChange(exp.id, 'position', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="date"
                            placeholder="Start Date"
                            value={exp.startDate}
                            onChange={(e) => handleWorkExperienceChange(exp.id, 'startDate', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg"
                          />
                          <input
                            type="date"
                            placeholder="End Date"
                            value={exp.endDate}
                            onChange={(e) => handleWorkExperienceChange(exp.id, 'endDate', e.target.value)}
                            disabled={exp.current}
                            className="w-full px-4 py-2 border rounded-lg"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={exp.current}
                            onChange={(e) => handleWorkExperienceChange(exp.id, 'current', e.target.checked)}
                            className="rounded"
                          />
                          <label>Current Position</label>
                        </div>
                        <textarea
                          placeholder="Description (one point per line)"
                          value={exp.description.join('\n')}
                          onChange={(e) => handleWorkExperienceChange(exp.id, 'description', e.target.value.split('\n'))}
                          className="w-full px-4 py-2 border rounded-lg h-32"
                        />
                        <button
                          onClick={() => handleGenerateJobDescription(exp.id, exp.position)}
                          disabled={!exp.position}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300"
                        >
                          <Wand2 className="w-5 h-5" />
                          Generate Description
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleAddWorkExperience}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400"
                    >
                      <Plus className="w-5 h-5" />
                      Add Experience
                    </button>
                  </div>
                )}

                {activeSection === 'education' && (
                  <div className="space-y-6">
                    {resume.education.map((edu, index) => (
                      <div key={edu.id} className="space-y-4 border-b pb-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">Education {index + 1}</h3>
                          <button
                            onClick={() => setResume(prev => ({
                              ...prev,
                              education: prev.education.filter(e => e.id !== edu.id)
                            }))}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="School"
                          value={edu.school}
                          onChange={(e) => handleEducationChange(edu.id, 'school', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="Degree"
                          value={edu.degree}
                          onChange={(e) => handleEducationChange(edu.id, 'degree', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="Field of Study"
                          value={edu.field}
                          onChange={(e) => handleEducationChange(edu.id, 'field', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                        <input
                          type="date"
                          placeholder="Graduation Date"
                          value={edu.graduationDate}
                          onChange={(e) => handleEducationChange(edu.id, 'graduationDate', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                        <textarea
                          placeholder="Achievements (one per line)"
                          value={edu.achievements.join('\n')}
                          onChange={(e) => handleEducationChange(edu.id, 'achievements', e.target.value.split('\n'))}
                          className="w-full px-4 py-2 border rounded-lg h-32"
                        />
                      </div>
                    ))}
                    <button
                      onClick={handleAddEducation}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400"
                    >
                      <Plus className="w-5 h-5" />
                      Add Education
                    </button>
                  </div>
                )}

                {activeSection === 'skills' && (
                  <div className="space-y-4">
                    <textarea
                      placeholder="Skills (one per line)"
                      value={resume.skills.join('\n')}
                      onChange={(e) => handleSkillsChange(e.target.value.split('\n'))}
                      className="w-full px-4 py-2 border rounded-lg h-40"
                    />
                  </div>
                )}

                {activeSection === 'projects' && (
                  <div className="space-y-6">
                    {resume.projects.map((project, index) => (
                      <div key={project.id} className="space-y-4 border-b pb-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">Project {index + 1}</h3>
                          <button
                            onClick={() => setResume(prev => ({
                              ...prev,
                              projects: prev.projects.filter(p => p.id !== project.id)
                            }))}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Project Title"
                          value={project.title}
                          onChange={(e) => handleProjectChange(project.id, 'title', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                        <textarea
                          placeholder="Project Description"
                          value={project.description}
                          onChange={(e) => handleProjectChange(project.id, 'description', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg h-32"
                        />
                        <input
                          type="text"
                          placeholder="Technologies (comma-separated)"
                          value={project.technologies.join(', ')}
                          onChange={(e) => handleProjectChange(project.id, 'technologies', e.target.value.split(', '))}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                        <input
                          type="url"
                          placeholder="GitHub URL"
                          value={project.githubUrl}
                          onChange={(e) => handleProjectChange(project.id, 'githubUrl', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                        <input
                          type="url"
                          placeholder="Live Demo URL"
                          value={project.liveUrl}
                          onChange={(e) => handleProjectChange(project.id, 'liveUrl', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                    ))}
                    <button
                      onClick={handleAddProject}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400"
                    >
                      <Plus className="w-5 h-5" />
                      Add Project
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="col-span-8 bg-white rounded-lg shadow p-6">
            <div className="prose max-w-none">
              <h1 className="text-3xl font-bold">{resume.personalInfo.fullName || 'Your Name'}</h1>
              <div className="flex gap-4 text-gray-600 mb-4">
                {resume.personalInfo.email && <span>{resume.personalInfo.email}</span>}
                {resume.personalInfo.phone && <span>{resume.personalInfo.phone}</span>}
                {resume.personalInfo.location && <span>{resume.personalInfo.location}</span>}
              </div>
              
              {resume.summary && (
                <>
                  <h2 className="text-xl font-semibold mt-6">Professional Summary</h2>
                  <p>{resume.summary}</p>
                </>
              )}

              {resume.workExperience.length > 0 && (
                <>
                  <h2 className="text-xl font-semibold mt-6">Work Experience</h2>
                  {resume.workExperience.map(exp => (
                    <div key={exp.id} className="mb-4">
                      <h3 className="text-lg font-medium">{exp.position}</h3>
                      <p className="text-gray-600">{exp.company} | {exp.startDate} - {exp.current ? 'Present' : exp.endDate}</p>
                      <ul className="list-disc pl-4 mt-2">
                        {exp.description.map((desc, i) => (
                          <li key={i}>{desc}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </>
              )}

              {resume.education.length > 0 && (
                <>
                  <h2 className="text-xl font-semibold mt-6">Education</h2>
                  {resume.education.map(edu => (
                    <div key={edu.id} className="mb-4">
                      <h3 className="text-lg font-medium">{edu.degree} in {edu.field}</h3>
                      <p className="text-gray-600">{edu.school} | {edu.graduationDate}</p>
                      {edu.achievements.length > 0 && (
                        <ul className="list-disc pl-4 mt-2">
                          {edu.achievements.map((achievement, i) => (
                            <li key={i}>{achievement}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </>
              )}

              {resume.skills.length > 0 && (
                <>
                  <h2 className="text-xl font-semibold mt-6">Skills</h2>
                  <p>{resume.skills.join(', ')}</p>
                </>
              )}

              {resume.projects.length > 0 && (
                <>
                  <h2 className="text-xl font-semibold mt-6">Projects</h2>
                  {resume.projects.map(project => (
                    <div key={project.id} className="mb-4">
                      <h3 className="text-lg font-medium">{project.title}</h3>
                      <p>{project.description}</p>
                      <p className="text-gray-600">Technologies: {project.technologies.join(', ')}</p>
                      <div className="flex gap-4 mt-2">
                        {project.githubUrl && (
                          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                            GitHub
                          </a>
                        )}
                        {project.liveUrl && (
                          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                            Live Demo
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Feedback Panel */}
        {feedback && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">AI Analysis Feedback</h2>
            <div className="prose max-w-none">
              {feedback.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}