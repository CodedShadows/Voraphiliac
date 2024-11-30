import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

const new_profile_1 = new ModalBuilder({
  custom_id: 'new_profile_1',
  title: 'New Character Profile (1/2)'
}).addComponents(
  new ActionRowBuilder({
    components: [
      new TextInputBuilder({
        custom_id: 'name',
        placeholder: 'Full name',
        label: "What is the character's name?",
        min_length: 3,
        max_length: 32,
        style: TextInputStyle.Short
      })
    ]
  }),
  new ActionRowBuilder({
    components: [
      new TextInputBuilder({
        custom_id: 'role',
        placeholder: 'Apex Pred/Pred/Pred Switch/Switch/Prey Switch/Prey',
        label: "What is the character's vore role?",
        min_length: 4,
        max_length: 15,
        style: TextInputStyle.Short
      })
    ]
  }),
  new ActionRowBuilder({
    components: [
      new TextInputBuilder({
        custom_id: 'gender',
        placeholder: 'Gender',
        label: "What is your character's gender?",
        min_length: 3,
        max_length: 32,
        style: TextInputStyle.Short
      })
    ]
  }),
  new ActionRowBuilder({
    components: [
      new TextInputBuilder({
        custom_id: 'species',
        placeholder: 'Species',
        label: "What is your character's species?",
        min_length: 3,
        max_length: 32,
        style: TextInputStyle.Short
      })
    ]
  })
);
const new_profile_2 = new ModalBuilder({
  custom_id: 'new_profile_2',
  title: 'New Character Profile (2/2)'
}).addComponents(
  new ActionRowBuilder({
    components: [
      new TextInputBuilder({
        custom_id: 'weight',
        placeholder: '123.456 (Number only, max of three decimal places)',
        label: "What is your character's weight in KG?",
        min_length: 1,
        max_length: 16,
        style: TextInputStyle.Short
      })
    ]
  }),
  new ActionRowBuilder({
    components: [
      new TextInputBuilder({
        custom_id: 'height',
        placeholder: '123.456 (Number only, max of three decimal places)',
        label: "What is your character's height in CM?",
        min_length: 1,
        max_length: 16,
        style: TextInputStyle.Short
      })
    ]
  }),
  new ActionRowBuilder({
    components: [
      new TextInputBuilder({
        custom_id: 'description',
        placeholder: 'Description',
        label: 'Describe this character',
        min_length: 3,
        max_length: 2048,
        style: TextInputStyle.Paragraph
      })
    ]
  })
);
const edit_image = new ModalBuilder({ custom_id: 'edit_image', title: 'Edit Image' }).addComponents(
  new ActionRowBuilder({
    components: [
      new TextInputBuilder({
        custom_id: 'image',
        placeholder: 'Image URL',
        label: 'What is the image URL?',
        min_length: 3,
        max_length: 2048,
        style: TextInputStyle.Short
      })
    ]
  })
);
const profileModals = {
  name: [
    new TextInputBuilder({
      custom_id: 'name',
      placeholder: 'Full name',
      label: "What is the character's name?",
      min_length: 3,
      max_length: 32,
      style: TextInputStyle.Short
    })
  ],
  role: [
    new TextInputBuilder({
      custom_id: 'role',
      placeholder: 'Apex Pred/Pred/Pred Switch/Switch/Prey Switch/Prey',
      label: "What is the character's vore role?",
      min_length: 4,
      max_length: 15,
      style: TextInputStyle.Short
    })
  ],
  description: [
    new TextInputBuilder({
      custom_id: 'description',
      placeholder: 'Description',
      label: 'Describe this character',
      min_length: 3,
      max_length: 2048,
      style: TextInputStyle.Paragraph
    })
  ],
  gender: [
    new TextInputBuilder({
      custom_id: 'gender',
      placeholder: 'Gender',
      label: "What is your character's gender?",
      min_length: 3,
      max_length: 32,
      style: TextInputStyle.Short
    })
  ],
  species: [
    new TextInputBuilder({
      custom_id: 'species',
      placeholder: 'Species',
      label: "What is your character's species?",
      min_length: 3,
      max_length: 32,
      style: TextInputStyle.Short
    })
  ],
  height: [
    new TextInputBuilder({
      custom_id: 'height',
      placeholder: '123.456 (Number only, max of three decimal places)',
      label: "What is your character's height in CM?",
      min_length: 1,
      max_length: 16,
      style: TextInputStyle.Short
    })
  ],
  weight: [
    new TextInputBuilder({
      custom_id: 'weight',
      placeholder: '123.456 (Number only, max of three decimal places)',
      label: "What is your character's weight in KG?",
      min_length: 1,
      max_length: 16,
      style: TextInputStyle.Short
    })
  ],
  autodigest: [
    new TextInputBuilder({
      custom_id: 'autodigest',
      label: 'Should your character autodigest prey?',
      placeholder: 'Yes/No',
      min_length: 2,
      max_length: 3,
      style: TextInputStyle.Short
    })
  ]
};

export { new_profile_1, new_profile_2, edit_image, profileModals };
