"""IFCWise job tools. Implementations arrive in Phase 4 (see TASKS.md)."""

from pathlib import Path

import typer

from ifc_tools import __version__

app = typer.Typer(help="Prepare IFCWise job folders and validate IFC output.", no_args_is_help=True)


def _job_dir(path: Path) -> Path:
    if not path.is_dir():
        typer.echo(f"Not a folder: {path}", err=True)
        raise typer.Exit(2)
    return path


@app.command()
def prepare(job_dir: Path) -> None:
    """Extract DXF/PDF data into prepared/ and render PROMPT.md."""
    _job_dir(job_dir)
    typer.echo(f"prepare: not implemented yet ({job_dir})")


@app.command()
def validate(job_dir: Path) -> None:
    """Check output/model.ifc and write output/summary.json."""
    _job_dir(job_dir)
    typer.echo(f"validate: not implemented yet ({job_dir})")


@app.command()
def version() -> None:
    """Print the version."""
    typer.echo(__version__)
